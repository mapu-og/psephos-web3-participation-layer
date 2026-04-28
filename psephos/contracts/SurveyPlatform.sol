// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract SurveyPlatform is ReentrancyGuard {
    // ──────────────────── Custom Errors ────────────────────

    error EmptyTitle();
    error EmptyIpfsHash();
    error RewardMustBePositive();
    error MaxResponsesMustBePositive();
    error DeadlineInPast();
    error IncorrectDeposit();
    error SurveyNotActive();
    error SurveyExpired();
    error MaxResponsesReached();
    error AlreadyResponded();
    error DidNotRespond();
    error AlreadyClaimed();
    error TransferFailed();
    error OnlyCreator();
    error SurveyStillActive();
    error NothingToWithdraw();
    error NoResponseFound();
    error InvalidSurveyId();

    // ──────────────────── Structs ────────────────────

    struct Survey {
        address creator;
        string title;
        string ipfsHash;
        uint256 rewardPerResponse;
        uint256 maxResponses;
        uint256 responseCount;
        uint256 deadline;
        uint256 balance;
        bool active;
    }

    struct Response {
        address respondent;
        string answerHash;
        uint256 timestamp;
        bool claimed;
    }

    // ──────────────────── State ────────────────────

    uint256 public nextSurveyId;

    mapping(uint256 => Survey) public surveys;
    mapping(uint256 => Response[]) public responses;
    mapping(uint256 => mapping(address => bool)) public hasResponded;
    mapping(uint256 => mapping(address => uint256)) private responseIndexOf;

    // ──────────────────── Events ────────────────────

    event SurveyCreated(
        uint256 indexed surveyId,
        address indexed creator,
        string title,
        uint256 rewardPerResponse,
        uint256 maxResponses,
        uint256 deadline
    );

    event AnswerSubmitted(
        uint256 indexed surveyId,
        address indexed respondent,
        uint256 responseIndex
    );

    event RewardClaimed(
        uint256 indexed surveyId,
        address indexed respondent,
        uint256 amount
    );

    event SurveyClosed(uint256 indexed surveyId, address indexed creator);

    // ──────────────────── Constructor ────────────────────

    constructor() {}

    // ──────────────────── Public Functions ────────────────────

    function createSurvey(
        string calldata _title,
        string calldata _ipfsHash,
        uint256 _rewardPerResponse,
        uint256 _maxResponses,
        uint256 _deadline
    ) external payable nonReentrant {
        if (bytes(_title).length == 0) revert EmptyTitle();
        if (bytes(_ipfsHash).length == 0) revert EmptyIpfsHash();
        if (_rewardPerResponse == 0) revert RewardMustBePositive();
        if (_maxResponses == 0) revert MaxResponsesMustBePositive();
        if (_deadline <= block.timestamp) revert DeadlineInPast();
        if (msg.value != _rewardPerResponse * _maxResponses) revert IncorrectDeposit();

        uint256 surveyId = nextSurveyId++;

        surveys[surveyId] = Survey({
            creator: msg.sender,
            title: _title,
            ipfsHash: _ipfsHash,
            rewardPerResponse: _rewardPerResponse,
            maxResponses: _maxResponses,
            responseCount: 0,
            deadline: _deadline,
            balance: msg.value,
            active: true
        });

        emit SurveyCreated(
            surveyId,
            msg.sender,
            _title,
            _rewardPerResponse,
            _maxResponses,
            _deadline
        );
    }

    function submitResponse(uint256 surveyId, string calldata answerHash) external {
        if (surveyId >= nextSurveyId) revert InvalidSurveyId();
        Survey storage s = surveys[surveyId];
        if (!s.active) revert SurveyNotActive();
        if (block.timestamp > s.deadline) revert SurveyExpired();
        if (s.responseCount >= s.maxResponses) revert MaxResponsesReached();
        if (hasResponded[surveyId][msg.sender]) revert AlreadyResponded();

        uint256 idx = responses[surveyId].length;
        responses[surveyId].push(Response({
            respondent: msg.sender,
            answerHash: answerHash,
            timestamp: block.timestamp,
            claimed: false
        }));

        hasResponded[surveyId][msg.sender] = true;
        responseIndexOf[surveyId][msg.sender] = idx;
        s.responseCount++;

        emit AnswerSubmitted(surveyId, msg.sender, idx);
    }

    function claimReward(uint256 surveyId) external nonReentrant {
        if (surveyId >= nextSurveyId) revert InvalidSurveyId();
        if (!hasResponded[surveyId][msg.sender]) revert DidNotRespond();
        uint256 idx = responseIndexOf[surveyId][msg.sender];
        if (responses[surveyId][idx].claimed) revert AlreadyClaimed();

        responses[surveyId][idx].claimed = true;

        Survey storage s = surveys[surveyId];
        s.balance -= s.rewardPerResponse;

        (bool ok, ) = payable(msg.sender).call{value: s.rewardPerResponse}("");
        if (!ok) revert TransferFailed();

        emit RewardClaimed(surveyId, msg.sender, s.rewardPerResponse);
    }

    function closeSurvey(uint256 surveyId) external {
        if (surveyId >= nextSurveyId) revert InvalidSurveyId();
        Survey storage s = surveys[surveyId];
        if (msg.sender != s.creator) revert OnlyCreator();
        if (!s.active) revert SurveyNotActive();

        s.active = false;

        emit SurveyClosed(surveyId, msg.sender);
    }

    function withdrawRemaining(uint256 surveyId) external nonReentrant {
        if (surveyId >= nextSurveyId) revert InvalidSurveyId();
        Survey storage s = surveys[surveyId];
        if (msg.sender != s.creator) revert OnlyCreator();
        if (s.active && block.timestamp <= s.deadline) revert SurveyStillActive();

        s.active = false;

        // Protect unclaimed rewards
        uint256 claimedCount = 0;
        Response[] storage resps = responses[surveyId];
        for (uint256 i = 0; i < resps.length; i++) {
            if (resps[i].claimed) claimedCount++;
        }
        uint256 unclaimedRewards = (s.responseCount - claimedCount) * s.rewardPerResponse;
        uint256 withdrawable = s.balance - unclaimedRewards;
        if (withdrawable == 0) revert NothingToWithdraw();

        s.balance -= withdrawable;

        (bool ok, ) = payable(msg.sender).call{value: withdrawable}("");
        if (!ok) revert TransferFailed();
    }

    // ──────────────────── View Functions ────────────────────

    function getSurvey(uint256 id) external view returns (Survey memory) {
        if (id >= nextSurveyId) revert InvalidSurveyId();
        return surveys[id];
    }

    function getSurveyCount() external view returns (uint256) {
        return nextSurveyId;
    }

    function getResponse(uint256 surveyId, address respondent) external view returns (Response memory) {
        if (surveyId >= nextSurveyId) revert InvalidSurveyId();
        if (!hasResponded[surveyId][respondent]) revert NoResponseFound();
        uint256 idx = responseIndexOf[surveyId][respondent];
        return responses[surveyId][idx];
    }

    function getActiveSurveys() external view returns (uint256[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < nextSurveyId; i++) {
            if (surveys[i].active && block.timestamp <= surveys[i].deadline) {
                count++;
            }
        }

        uint256[] memory activeIds = new uint256[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < nextSurveyId; i++) {
            if (surveys[i].active && block.timestamp <= surveys[i].deadline) {
                activeIds[idx++] = i;
            }
        }
        return activeIds;
    }
}
