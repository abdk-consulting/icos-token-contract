# ICOS Token Smart Contract: API #

This document defines API of the smart contract that manages ICOS tokens.

## 1. Constructors

### 1.1. ICOSToken(uint256)

#### Signature

    function ICOSToken (uint256 _tokensCount)

#### Description

Deploy ICOS Token Smart Contract, issue given number of tokens and give them to message sender.
May be called by anybody.
Does not accept ether

#### Use Cases

* Administration:Deploy

## 2. Methods

### 2.1. name()

#### Signature:

    function name() constant
    returns (string name)

#### Description

Return name of the token.
May be called by anybody.
Does not accept ether.
This method is a non-standard extension for ERC-20.

#### Use Cases:

* ERC20*:Name

### 2.2. decimals()

#### Signature:

    function decimals() constant
    returns (uint8 decimals)

#### Description

Return number of decimals for the token.
May be called by anybody.
Does not accept ether.
This method is a non-standard extension for ERC-20.

#### Use Cases:

* ERC20*:Decimals

### 2.3. totalSupply()

#### Signature:

    function totalSupply() constant
    returns (uint256 supply)

#### Description:

Return total number of tokens (possibly zero) in circulation.
May be called by anybody.
Does not accept ether.
Defined by ERC-20.

#### Use Cases:

* ERC20:TotalSupply

### 2.4. balanceOf(address)

#### Signature:

    function balanceOf(address _owner) constant
    returns (uint256 balance)

#### Description:

Return number of tokens (possibly zero) currently belonging to the owner of address _owner.
May be called by anybody.
Does not accept ether.
Defined by ERC-20.

#### Use Cases:

* ERC20:BalanceOf

### 2.5. transfer(address,uint256)

#### Signature:

    function transfer(address _to, uint256 _value)
    returns (bool success)

#### Description:

Transfer _value tokens from the balance of method caller to the balance of the owner of address _to.
Returns true if transfer were successfully performed, false otherwise.
If this method returned false, it is guaranteed that balances were not changed.
May be called by anybody.
Does not accept ether.
Defined by ERC-20.

#### Use Cases:

* ERC20:Transfer

### 2.6. transferFrom(address,address,uint256)

#### Signature:

    function transferFrom(address _from, address _to, uint256 _value)
    returns (bool success)

#### Description:

Transfer _value tokens from the balance of the owner of address _from to the owner of address _to.
Returns true if transfer were successfully performed, false otherwise.
If this method returned false, it is guaranteed that balances were not changed.
May be called by anybody.
Does not accept ether.
Defined by ERC-20.

#### Use Cases:

* ERC20:TransferFrom

### 2.7. approve(address,uint256)

#### Signature:

    function approve(address _spender, uint256 _value)
    returns (bool success)

#### Description:

Allow owner of address _spender to transfer at most _value tokens (possibly zero) from the balance of method caller to any address using transferFrom method.
Call to this method overrides any previous calls to this method performed by the same caller with the same _spender value.
Returns true if transfer was approved successfully, false otherwise.
If this method returned false, it is guaranteed that contract state was not changed.
May be called by anybody.
Does not accept ether.
Defined by ERC-20.

#### Use Cases:

* ERC20:Approve

### 2.8. approve(address,uint256,uint256) ###

#### Signature: ####

    function approve(address _spender, uint256 _currentValue, uint256 _newValue)
    returns (bool success)

#### Description: ####

Change from _currentValue to _newValue the number of tokens _spender is allowed to transfer from the balance of method caller.  If actual allowance does not equal to passed _currentValue, this method does not change allowance.  Returns true if allowance was changed successfully, false otherwise.  If this method returned false, it is guaranteed that contract state was not changed.  May be called by anybody.  Does not accept ether.  This method is a non-standard extension for ERC-20 that tries to address allowance double spending problem.

#### Use Cases: ####

* ERC20*:SafeApprove

### 2.9. allowance(address,address)

#### Signature:

    function allowance(address _owner, address _spender) constant
    returns (uint256 remaining)

#### Description:

Returns maximum number of tokens (possibly zero) the owner of address _spender is allowed to transfer from the balance of the owner of address _owner using transferFrom method.
May be called by anybody.
Does not accept ether.
Defined by ERC-20.

#### Use Cases:

* ERC20:Allowance

### 2.10. burnTokens(uint256)

#### Signature:

    function burnTokens(uint256 _value)
    returns (bool success)

#### Description:

Burn (i.e. destroy) _value tokens belonging to message sender.
Returns true if tokens were destroyed successfully, false otherwise.
If this method returned false, it is guaranteed that contract state was not changed.
May be called by anybody.
Does not accept ether.

#### Use Cases:

* Token:Burn

### 2.11. freezeTransfers()

#### Signature:

    function freezeTransfers()

#### Description:

Freeze all token transfers.
All transfer requests will be rejected until token transfer will be unfrozen.
May only be called by the owner of the contract.
Does not accept ether.

#### Use Cases:

* Admin:Freeze

### 2.12. unfreezeTransfers()

#### Signature:

    function unfreezeTransfers()

#### Description:

Unfreeze token transfers.
May only be called by the owner of the contract.
Does not accept ether.

#### Use Cases:

* Admin:Unfreeze

### 2.13. setOwner()

#### Signature:

    function setOwner(address _newOwner)

#### Description:

Set owner address for the contract to the _newOwner.
May only be called by the owner of the contract.
Does not accept ether.

#### Use Cases:

* Admin:SetOwner

## 3. Events ##

### 3.1. Transfer(address,address,uint256) ###

#### Signature: ####

    event Transfer (
      address indexed _from,
      address indexed _to,
      uint256 _value)

#### Description: ####

This event is logged when _value tokens were transferred from _from account to _to account.  Defined by ERC-20.

#### Use Cases: ####

* ERC20:Transfer
* ERC20:TransferFrom

### 3.2. Approval(address,address,uint256) ###

#### Signature: ####

    event Approval (
      address indexed _owner,
      address indexed _spender,
      uint256 _value)

#### Description: ####

This event is logged when _owner allowed _spender to transfer at most _value tokens from _owner's account.  Defined by ERC-20.

#### Use Cases: ####

* ERC20:Approve

### 3.3. Freeze() ###

#### Signature: ####

    event Freeze ()

#### Description: ####

This event is logged when token transfers were frozen.

#### Use Cases: ####

* Admin:Freeze

### 3.4. Unfreeze() ###

#### Signature: ####

    event Unfreeze ()

#### Description: ####

This event is logged when token transfers were unfrozen.

#### Use Cases: ####

* Admin:Unfreeze
