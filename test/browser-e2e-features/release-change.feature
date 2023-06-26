
Feature: Release Change
Background: I am at the vending machine
Scenario Outline: reelase change return correct change amount and message
Given I insert <quarters> quarters
And I insert <dimes> dimes
And I insert <nickels> nickels
And I insert <bills> bills
When I release change
And I should see <message> message
And I should get <change> in change

Examples:
|   quarters    |   dimes   |   nickels |   bills   |   change        |   message                    |
|   0           |   0       |   0       |   0       |   '0Q, 0D, 0N'  |   'No change to release'     |
|   1           |   1       |   1       |   0       |   '1Q, 1D, 1N'  |   'Please take your change'  |
|   1           |   2       |   3       |   0       |   '2Q, 1D, 0N'  |   'Please take your change'  |
|   1           |   0       |   0       |   1       |   '5Q, 0D, 0N'  |   'Please take your change'  |
|   0           |   0       |   0       |   5       |   '20Q, 0D, 0N' |  'Please take your change'  |