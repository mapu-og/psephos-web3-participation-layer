import { expect } from "chai";
import { ethers, network } from "hardhat";
import { SurveyPlatform } from "../typechain-types";

describe("SurveyPlatform", function () {
  let survey: SurveyPlatform;
  let owner: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let respondent: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let respondent2: Awaited<ReturnType<typeof ethers.getSigners>>[0];

  const REWARD = ethers.parseEther("0.01");
  const MAX_RESPONSES = 10n;
  const TOTAL_DEPOSIT = REWARD * MAX_RESPONSES;

  async function deployAndCreateSurvey(deadline?: number, maxResp?: bigint) {
    const dl = deadline ?? Math.floor(Date.now() / 1000) + 3600;
    const mr = maxResp ?? MAX_RESPONSES;
    await survey.createSurvey("Test Survey", "QmTestHash123", REWARD, mr, dl, {
      value: REWARD * mr,
    });
    return { surveyId: 0n, deadline: dl };
  }

  beforeEach(async function () {
    [owner, respondent, respondent2] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("SurveyPlatform");
    survey = await factory.deploy();
    await survey.waitForDeployment();
  });

  it("should deploy successfully", async function () {
    const addr = await survey.getAddress();
    expect(addr).to.be.properAddress;
  });

  it("should create a survey with ETH deposit", async function () {
    const deadline = Math.floor(Date.now() / 1000) + 3600; // +1 hour

    const tx = await survey.createSurvey(
      "Test Survey",
      "QmTestHash123",
      REWARD,
      MAX_RESPONSES,
      deadline,
      { value: TOTAL_DEPOSIT }
    );

    await expect(tx)
      .to.emit(survey, "SurveyCreated")
      .withArgs(0, owner.address, "Test Survey", REWARD, MAX_RESPONSES, deadline);

    const s = await survey.surveys(0);
    expect(s.creator).to.equal(owner.address);
    expect(s.title).to.equal("Test Survey");
    expect(s.ipfsHash).to.equal("QmTestHash123");
    expect(s.rewardPerResponse).to.equal(REWARD);
    expect(s.maxResponses).to.equal(MAX_RESPONSES);
    expect(s.responseCount).to.equal(0);
    expect(s.balance).to.equal(TOTAL_DEPOSIT);
    expect(s.active).to.be.true;
  });

  it("should increment nextSurveyId", async function () {
    const deadline = Math.floor(Date.now() / 1000) + 3600;

    await survey.createSurvey("S1", "Qm1", REWARD, MAX_RESPONSES, deadline, {
      value: TOTAL_DEPOSIT,
    });
    await survey.createSurvey("S2", "Qm2", REWARD, MAX_RESPONSES, deadline, {
      value: TOTAL_DEPOSIT,
    });

    expect(await survey.nextSurveyId()).to.equal(2);
  });

  it("should revert with empty title", async function () {
    const deadline = Math.floor(Date.now() / 1000) + 3600;
    await expect(
      survey.createSurvey("", "QmHash", REWARD, MAX_RESPONSES, deadline, {
        value: TOTAL_DEPOSIT,
      })
    ).to.be.revertedWithCustomError(survey, "EmptyTitle");
  });

  it("should revert with incorrect ETH amount", async function () {
    const deadline = Math.floor(Date.now() / 1000) + 3600;
    await expect(
      survey.createSurvey("Title", "QmHash", REWARD, MAX_RESPONSES, deadline, {
        value: ethers.parseEther("0.001"),
      })
    ).to.be.revertedWithCustomError(survey, "IncorrectDeposit");
  });

  it("should revert with past deadline", async function () {
    await expect(
      survey.createSurvey("Title", "QmHash", REWARD, MAX_RESPONSES, 1000, {
        value: TOTAL_DEPOSIT,
      })
    ).to.be.revertedWithCustomError(survey, "DeadlineInPast");
  });

  // ──────────────────── submitResponse ────────────────────

  it("should submit a response and emit AnswerSubmitted", async function () {
    await deployAndCreateSurvey();
    await expect(
      survey.connect(respondent).submitResponse(0, "QmAnswerHash")
    )
      .to.emit(survey, "AnswerSubmitted")
      .withArgs(0, respondent.address, 0);

    expect(await survey.hasResponded(0, respondent.address)).to.be.true;
  });

  it("should revert if respondent already responded", async function () {
    await deployAndCreateSurvey();
    await survey.connect(respondent).submitResponse(0, "QmAnswerHash");
    await expect(
      survey.connect(respondent).submitResponse(0, "QmAnswerHash2")
    ).to.be.revertedWithCustomError(survey, "AlreadyResponded");
  });

  it("should revert if survey is expired", async function () {
    const deadline = Math.floor(Date.now() / 1000) + 60;
    await deployAndCreateSurvey(deadline);
    await network.provider.send("evm_increaseTime", [120]);
    await network.provider.send("evm_mine", []);
    await expect(
      survey.connect(respondent).submitResponse(0, "QmAnswerHash")
    ).to.be.revertedWithCustomError(survey, "SurveyExpired");
  });

  it("should revert if maxResponses reached", async function () {
    await deployAndCreateSurvey(Math.floor(Date.now() / 1000) + 3600, 1n);
    await survey.connect(respondent).submitResponse(0, "QmAnswerHash");
    await expect(
      survey.connect(respondent2).submitResponse(0, "QmAnswerHash2")
    ).to.be.revertedWithCustomError(survey, "MaxResponsesReached");
  });

  // ──────────────────── claimReward ────────────────────

  it("should claim reward and transfer ETH", async function () {
    await deployAndCreateSurvey();
    await survey.connect(respondent).submitResponse(0, "QmAnswerHash");

    const balanceBefore = await ethers.provider.getBalance(respondent.address);
    const tx = await survey.connect(respondent).claimReward(0);
    const receipt = await tx.wait();
    const gasUsed = receipt!.gasUsed * receipt!.gasPrice;
    const balanceAfter = await ethers.provider.getBalance(respondent.address);

    expect(balanceAfter - balanceBefore + gasUsed).to.equal(REWARD);
    await expect(tx)
      .to.emit(survey, "RewardClaimed")
      .withArgs(0, respondent.address, REWARD);
  });

  it("should revert on double claim", async function () {
    await deployAndCreateSurvey();
    await survey.connect(respondent).submitResponse(0, "QmAnswerHash");
    await survey.connect(respondent).claimReward(0);
    await expect(
      survey.connect(respondent).claimReward(0)
    ).to.be.revertedWithCustomError(survey, "AlreadyClaimed");
  });

  it("should revert if sender did not respond", async function () {
    await deployAndCreateSurvey();
    await expect(
      survey.connect(respondent).claimReward(0)
    ).to.be.revertedWithCustomError(survey, "DidNotRespond");
  });

  // ──────────────────── closeSurvey ────────────────────

  it("should close survey and emit SurveyClosed", async function () {
    await deployAndCreateSurvey();
    const tx = await survey.closeSurvey(0);
    await expect(tx)
      .to.emit(survey, "SurveyClosed")
      .withArgs(0, owner.address);

    const s = await survey.getSurvey(0);
    expect(s.active).to.be.false;
  });

  it("should revert if non-creator tries to close", async function () {
    await deployAndCreateSurvey();
    await expect(
      survey.connect(respondent).closeSurvey(0)
    ).to.be.revertedWithCustomError(survey, "OnlyCreator");
  });

  it("should revert if survey already closed", async function () {
    await deployAndCreateSurvey();
    await survey.closeSurvey(0);
    await expect(survey.closeSurvey(0)).to.be.revertedWithCustomError(survey, "SurveyNotActive");
  });

  // ──────────────────── withdrawRemaining ────────────────────

  it("should withdraw remaining after closing survey", async function () {
    await deployAndCreateSurvey();
    await survey.connect(respondent).submitResponse(0, "QmAnswer");
    await survey.connect(respondent).claimReward(0);
    await survey.closeSurvey(0);

    const balanceBefore = await ethers.provider.getBalance(owner.address);
    const tx = await survey.withdrawRemaining(0);
    const receipt = await tx.wait();
    const gasUsed = receipt!.gasUsed * receipt!.gasPrice;
    const balanceAfter = await ethers.provider.getBalance(owner.address);

    const expectedRemaining = REWARD * (MAX_RESPONSES - 1n);
    expect(balanceAfter - balanceBefore + gasUsed).to.equal(expectedRemaining);
  });

  it("should withdraw remaining after deadline expires", async function () {
    const block = await ethers.provider.getBlock("latest");
    const deadline = block!.timestamp + 60;
    await deployAndCreateSurvey(deadline);
    await network.provider.send("evm_increaseTime", [120]);
    await network.provider.send("evm_mine", []);

    await expect(survey.withdrawRemaining(0)).to.not.be.reverted;
  });

  it("should revert withdraw if survey still active", async function () {
    await deployAndCreateSurvey();
    await expect(survey.withdrawRemaining(0)).to.be.revertedWithCustomError(
      survey, "SurveyStillActive"
    );
  });

  it("should revert withdraw if non-creator", async function () {
    await deployAndCreateSurvey();
    await survey.closeSurvey(0);
    await expect(
      survey.connect(respondent).withdrawRemaining(0)
    ).to.be.revertedWithCustomError(survey, "OnlyCreator");
  });

  // ──────────────────── View Functions ────────────────────

  it("getSurvey returns correct data", async function () {
    await deployAndCreateSurvey();
    const s = await survey.getSurvey(0);
    expect(s.title).to.equal("Test Survey");
    expect(s.creator).to.equal(owner.address);
    expect(s.rewardPerResponse).to.equal(REWARD);
    expect(s.active).to.be.true;
  });

  it("getSurveyCount returns total surveys", async function () {
    expect(await survey.getSurveyCount()).to.equal(0);
    await deployAndCreateSurvey();
    expect(await survey.getSurveyCount()).to.equal(1);
  });

  it("getResponse returns respondent data", async function () {
    await deployAndCreateSurvey();
    await survey.connect(respondent).submitResponse(0, "QmAnswer");
    const r = await survey.getResponse(0, respondent.address);
    expect(r.respondent).to.equal(respondent.address);
    expect(r.answerHash).to.equal("QmAnswer");
    expect(r.claimed).to.be.false;
  });

  it("getResponse reverts for non-respondent", async function () {
    await deployAndCreateSurvey();
    await expect(
      survey.getResponse(0, respondent.address)
    ).to.be.revertedWithCustomError(survey, "NoResponseFound");
  });

  it("getActiveSurveys returns only active surveys", async function () {
    await deployAndCreateSurvey();
    await deployAndCreateSurvey();
    let active = await survey.getActiveSurveys();
    expect(active.length).to.equal(2);

    await survey.closeSurvey(0);
    active = await survey.getActiveSurveys();
    expect(active.length).to.equal(1);
    expect(active[0]).to.equal(1);
  });

  // ──────────────────── New Tests ────────────────────

  it("withdrawRemaining only withdraws surplus, not unclaimed rewards", async function () {
    // Create survey with 2 max responses
    await deployAndCreateSurvey(Math.floor(Date.now() / 1000) + 3600, 2n);
    // Respondent submits but does NOT claim
    await survey.connect(respondent).submitResponse(0, "QmAnswer");
    // Close survey so creator can withdraw
    await survey.closeSurvey(0);

    const balanceBefore = await ethers.provider.getBalance(owner.address);
    const tx = await survey.withdrawRemaining(0);
    const receipt = await tx.wait();
    const gasUsed = receipt!.gasUsed * receipt!.gasPrice;
    const balanceAfter = await ethers.provider.getBalance(owner.address);

    // Only the unfilled slot money (1 slot) should be withdrawn; respondent's reward is locked
    expect(balanceAfter - balanceBefore + gasUsed).to.equal(REWARD * 1n);
  });

  it("respondent can claimReward after creator withdrawRemaining", async function () {
    await deployAndCreateSurvey(Math.floor(Date.now() / 1000) + 3600, 2n);
    await survey.connect(respondent).submitResponse(0, "QmAnswer");
    await survey.closeSurvey(0);
    await survey.withdrawRemaining(0);

    const balanceBefore = await ethers.provider.getBalance(respondent.address);
    const tx = await survey.connect(respondent).claimReward(0);
    const receipt = await tx.wait();
    const gasUsed = receipt!.gasUsed * receipt!.gasPrice;
    const balanceAfter = await ethers.provider.getBalance(respondent.address);

    expect(balanceAfter - balanceBefore + gasUsed).to.equal(REWARD);
  });

  it("reverts with InvalidSurveyId for out-of-range surveyId", async function () {
    await expect(
      survey.connect(respondent).submitResponse(99, "QmAnswer")
    ).to.be.revertedWithCustomError(survey, "InvalidSurveyId");

    await expect(
      survey.connect(respondent).claimReward(99)
    ).to.be.revertedWithCustomError(survey, "InvalidSurveyId");

    await expect(
      survey.closeSurvey(99)
    ).to.be.revertedWithCustomError(survey, "InvalidSurveyId");

    await expect(
      survey.withdrawRemaining(99)
    ).to.be.revertedWithCustomError(survey, "InvalidSurveyId");

    await expect(
      survey.getSurvey(99)
    ).to.be.revertedWithCustomError(survey, "InvalidSurveyId");
  });
});

