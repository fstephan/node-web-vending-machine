Feature: Buy Product
Background: I am at the vending machine
Scenario Outline: buy a product returns correct product and message
Given I insert <quarters> quarters
And I insert <dimes> dimes
And I insert <nickels> nickels
And I insert <bills> bills
When I buy <selection> product 
Then I should receive <product> product
And I should see <message> message
And I should get <change> in change

Examples:
|   quarters    |   dimes   |   nickels |   bills   |   selection   |   product |   change        |   message            |
|   0           |   0       |   0       |   0       |   1           |   ''      |   '0Q, 0D, 0N'  |   'Please add 200c'  |
|   0           |   0       |   0       |   0       |   2           |   ''      |   '0Q, 0D, 0N'  |   'Please add 100c'  |
|   1           |   0       |   0       |   0       |   1           |   ''      |   '0Q, 0D, 0N'  |   'Please add 175c'  |
|   0           |   0       |   0       |   2       |   1           |   'Coke'  |   '0Q, 0D, 0N'  |   'Enjoy!'           |

