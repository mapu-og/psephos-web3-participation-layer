Changes made to frontend/src/app/survey/[id]/page.tsx:

Added parseContractError helper (after formatDate) that scans the raw error string (message + cause) for each custom error name and returns a friendly message:

Contract error	User message
AlreadyResponded	"You already responded to this survey."
SurveyNotActive	"This survey is no longer active."
SurveyFull	"This survey has reached its maximum number of responses."
InvalidSurveyId	"Invalid survey ID."
DeadlinePassed	"The deadline for this survey has passed."
NotARespondent	"You haven't responded to this survey."
AlreadyClaimed	"You have already claimed your reward."
NoRewardAvailable	"No reward is available for this survey."
gas-related	"Transaction failed — the survey may be inactive or you may have already responded."
User rejected	"Transaction cancelled."
fallback	"Transaction failed. Please try again."
Updated error renders:

submitWriteError → parseContractError(submitWriteError) (replaces raw .message)
claimWriteError → same helper, now also wrapped in the same styled error box (matching the submit UI pattern)
Changed 1 file
