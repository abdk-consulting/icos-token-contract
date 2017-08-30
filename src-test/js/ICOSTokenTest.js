/*
 * Test for ICOS Token Smart Contract.
 * Copyright © 2017 by ABDK Consulting.
 * Author: Mikhail Vladimirov <mikhail.vladimirov@gmail.com>
 */

tests.push ({
  name: "ICOSToken",
  steps: [
    { name: "Ensure there is at least one account: Alice",
      body: function (test) {
        while (!web3.eth.accounts || web3.eth.accounts.length < 1)
          personal.newAccount ("");

        test.alice = web3.eth.accounts [0];
      }},
    { name: "Ensure Alice has at least 5 ETH",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getBalance (test.alice).gte (web3.toWei ("5", "ether"));
      },
      body: function (test) {
        miner.stop ();
      }},
    { name: "Alice deploys three Wallet contracts: Bob, Carol and Dave",
      body: function (test) {
        test.walletContract = loadContract ("Wallet");
        var walletCode = loadContractCode ("Wallet");

        personal.unlockAccount (test.alice, "");
        test.tx1 = test.walletContract.new (
          {from: test.alice, data: walletCode, gas: 1000000}).
          transactionHash;
        test.tx2 = test.walletContract.new (
          {from: test.alice, data: walletCode, gas: 1000000}).
          transactionHash;
        test.tx3 = test.walletContract.new (
          {from: test.alice, data: walletCode, gas: 1000000}).
          transactionHash;
      }},
    { name: "Make sure contracts were deployed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx1) &&
          web3.eth.getTransactionReceipt (test.tx2) &&
         web3.eth.getTransactionReceipt (test.tx3);;
      },
      body: function (test) {
        miner.stop ();

        test.bob = getDeployedContract ("Bob", test.walletContract, test.tx1);
        test.carol = getDeployedContract ("Carol", test.walletContract, test.tx2);
        test.dave = getDeployedContract ("Dave", test.walletContract, test.tx3);
      }},
    { name: "Alice deploys ICOSTokenWrapper with 1000 tokens",
      body: function (test) {
        test.icosTokenWrapperContract = loadContract ("ICOSTokenWrapper");
        var icosTokenWrapperCode = loadContractCode ("ICOSTokenWrapper");

        personal.unlockAccount (test.alice, "");
        test.tx = test.icosTokenWrapperContract.new (
          1000,
          {from: test.alice, data: icosTokenWrapperCode, gas:1000000}).
          transactionHash;
      }},
    { name: "Make sure contract was deployed and Alice now has 1000 tokens",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        test.icosTokenWrapper = getDeployedContract (
          "ICOSTokenWrapper", test.icosTokenWrapperContract, test.tx)

        assertBNEquals (
            'test.icosTokenWrapper.balanceOf (test.alice)',
            1000,
            test.icosTokenWrapper.balanceOf (test.alice));

        assertEquals (
            'test.icosTokenWrapper.name ()',
            "ICOS",
            test.icosTokenWrapper.name ());

        assertBNEquals (
            'test.icosTokenWrapper.decimals ()',
            6,
            test.icosTokenWrapper.decimals ());

        assertEquals (
          "test.icosTokenWrapper.getOwner ()",
          test.alice,
          test.icosTokenWrapper.getOwner ());
      }},
    { name: "Alice transfers 100 tokens to Bob",
      body: function (test) {
        assertBNEquals (
            'test.icosTokenWrapper.balanceOf (test.alice)',
            1000,
            test.icosTokenWrapper.balanceOf (test.alice));

        assertBNEquals (
            'test.icosTokenWrapper.balanceOf (test.bob.address)',
            0,
            test.icosTokenWrapper.balanceOf (test.bob.address));

        personal.unlockAccount (test.alice, "");
        test.tx = test.icosTokenWrapper.transfer (
          test.bob.address,
          100,
          {from: test.alice, gas:1000000});
      }},
    { name: "Make sure transaction succeeded and Bob got 100 tokens",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.icosTokenWrapper.Result",
          test.icosTokenWrapper,
          test.icosTokenWrapper.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.icosTokenWrapper.Transfer",
          test.icosTokenWrapper,
          test.icosTokenWrapper.Transfer,
          test.tx,
          { _from: test.alice, _to: test.bob.address, _value: 100 });

        assertBNEquals (
            'test.icosTokenWrapper.balanceOf (test.alice)',
            900,
            test.icosTokenWrapper.balanceOf (test.alice));

        assertBNEquals (
            'test.icosTokenWrapper.balanceOf (test.bob.address)',
            100,
            test.icosTokenWrapper.balanceOf (test.bob.address));
      }},
    { name: "Bob tries to burn 101 token but he does not have such many tokens",
      body: function (test) {
        assertBNEquals (
            'test.icosTokenWrapper.totalSupply ()',
            1000,
            test.icosTokenWrapper.totalSupply ());

        assertBNEquals (
            'test.icosTokenWrapper.balanceOf (test.bob.address)',
            100,
            test.icosTokenWrapper.balanceOf (test.bob.address));

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.icosTokenWrapper.address,
          test.icosTokenWrapper.burnTokens.getData (101),
          0,
          {from: test.alice, gas:1000000});
      }},
    { name: "Make sure transaction succeeded but no tokens were burned",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.bob.Result",
          test.bob,
          test.bob.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.icosTokenWrapper.Result",
          test.icosTokenWrapper,
          test.icosTokenWrapper.Result,
          test.tx,
          { _value: false });

        assertBNEquals (
            'test.icosTokenWrapper.totalSupply ()',
            1000,
            test.icosTokenWrapper.totalSupply ());

        assertBNEquals (
            'test.icosTokenWrapper.balanceOf (test.bob.address)',
            100,
            test.icosTokenWrapper.balanceOf (test.bob.address));
      }},
    { name: "Bob burns zero tokens",
      body: function (test) {
        assertBNEquals (
            'test.icosTokenWrapper.totalSupply ()',
            1000,
            test.icosTokenWrapper.totalSupply ());

        assertBNEquals (
            'test.icosTokenWrapper.balanceOf (test.bob.address)',
            100,
            test.icosTokenWrapper.balanceOf (test.bob.address));

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.icosTokenWrapper.address,
          test.icosTokenWrapper.burnTokens.getData (0),
          0,
          {from: test.alice, gas:1000000});
      }},
    { name: "Make sure transaction succeeded but no tokens were burned",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.bob.Result",
          test.bob,
          test.bob.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.icosTokenWrapper.Result",
          test.icosTokenWrapper,
          test.icosTokenWrapper.Result,
          test.tx,
          { _value: true });

        assertBNEquals (
            'test.icosTokenWrapper.totalSupply ()',
            1000,
            test.icosTokenWrapper.totalSupply ());

        assertBNEquals (
            'test.icosTokenWrapper.balanceOf (test.bob.address)',
            100,
            test.icosTokenWrapper.balanceOf (test.bob.address));
      }},
    { name: "Bob burns 30 tokens",
      body: function (test) {
        assertBNEquals (
            'test.icosTokenWrapper.totalSupply ()',
            1000,
            test.icosTokenWrapper.totalSupply ());

        assertBNEquals (
            'test.icosTokenWrapper.balanceOf (test.bob.address)',
            100,
            test.icosTokenWrapper.balanceOf (test.bob.address));

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.icosTokenWrapper.address,
          test.icosTokenWrapper.burnTokens.getData (30),
          0,
          {from: test.alice, gas:1000000});
      }},
    { name: "Make sure transaction succeeded and 30 tokens were burned",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.bob.Result",
          test.bob,
          test.bob.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.icosTokenWrapper.Result",
          test.icosTokenWrapper,
          test.icosTokenWrapper.Result,
          test.tx,
          { _value: true });

        assertBNEquals (
            'test.icosTokenWrapper.totalSupply ()',
            970,
            test.icosTokenWrapper.totalSupply ());

        assertBNEquals (
            'test.icosTokenWrapper.balanceOf (test.bob.address)',
            70,
            test.icosTokenWrapper.balanceOf (test.bob.address));
      }},
    { name: "Bob burns 70 tokens",
      body: function (test) {
        assertBNEquals (
            'test.icosTokenWrapper.totalSupply ()',
            970,
            test.icosTokenWrapper.totalSupply ());

        assertBNEquals (
            'test.icosTokenWrapper.balanceOf (test.bob.address)',
            70,
            test.icosTokenWrapper.balanceOf (test.bob.address));

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.icosTokenWrapper.address,
          test.icosTokenWrapper.burnTokens.getData (70),
          0,
          {from: test.alice, gas:1000000});
      }},
    { name: "Make sure transaction succeeded and 70 tokens were burned",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.bob.Result",
          test.bob,
          test.bob.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.icosTokenWrapper.Result",
          test.icosTokenWrapper,
          test.icosTokenWrapper.Result,
          test.tx,
          { _value: true });

        assertBNEquals (
            'test.icosTokenWrapper.totalSupply ()',
            900,
            test.icosTokenWrapper.totalSupply ());

        assertBNEquals (
            'test.icosTokenWrapper.balanceOf (test.bob.address)',
            0,
            test.icosTokenWrapper.balanceOf (test.bob.address));
      }},
    { name: "Bob tries to make Carol the owner of smart contract, but he is not the owner of smart contract",
      body: function (test) {
        assertEquals (
            'test.icosTokenWrapper.getOwner ()',
            test.alice,
            test.icosTokenWrapper.getOwner ());

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.icosTokenWrapper.address,
          test.icosTokenWrapper.setOwner.getData (test.carol.address),
          0,
          {from: test.alice, gas:1000000});
      }},
    { name: "Make sure transaction failed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.bob.Result",
          test.bob,
          test.bob.Result,
          test.tx,
          { _value: false });

        assertEquals (
            'test.icosTokenWrapper.getOwner ()',
            test.alice,
            test.icosTokenWrapper.getOwner ());
      }},
    { name: "Alice makes Bob the owner of the smart contract",
      body: function (test) {
        assertEquals (
            'test.icosTokenWrapper.getOwner ()',
            test.alice,
            test.icosTokenWrapper.getOwner ());

        personal.unlockAccount (test.alice, "");
        test.tx = test.icosTokenWrapper.setOwner (
          test.bob.address,
          {from: test.alice, gas:1000000});
      }},
    { name: "Make sure transaction succeeded",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEquals (
            'test.icosTokenWrapper.getOwner ()',
            test.bob.address,
            test.icosTokenWrapper.getOwner ());
      }},
    { name: "Bob makes Carol the owner of smart contract",
      body: function (test) {
        assertEquals (
            'test.icosTokenWrapper.getOwner ()',
            test.bob.address,
            test.icosTokenWrapper.getOwner ());

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.icosTokenWrapper.address,
          test.icosTokenWrapper.setOwner.getData (test.carol.address),
          0,
          {from: test.alice, gas:1000000});
      }},
    { name: "Make sure transaction succeeded",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.bob.Result",
          test.bob,
          test.bob.Result,
          test.tx,
          { _value: true });

        assertEquals (
            'test.icosTokenWrapper.getOwner ()',
            test.carol.address,
            test.icosTokenWrapper.getOwner ());
      }},
    { name: "Alice transfers 100 tokens to Bob",
      body: function (test) {
        assertBNEquals (
            'test.icosTokenWrapper.balanceOf (test.alice)',
            900,
            test.icosTokenWrapper.balanceOf (test.alice));

        assertBNEquals (
            'test.icosTokenWrapper.balanceOf (test.bob.address)',
            0,
            test.icosTokenWrapper.balanceOf (test.bob.address));

        personal.unlockAccount (test.alice, "");
        test.tx = test.icosTokenWrapper.transfer (
          test.bob.address,
          100,
          {from: test.alice, gas:1000000});
      }},
    { name: "Make sure transaction succeeded and Bob got 100 tokens",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.icosTokenWrapper.Transfer",
          test.icosTokenWrapper,
          test.icosTokenWrapper.Transfer,
          test.tx,
          { _from: test.alice, _to: test.bob.address, _value: 100 });

        assertBNEquals (
            'test.icosTokenWrapper.balanceOf (test.alice)',
            800,
            test.icosTokenWrapper.balanceOf (test.alice));

        assertBNEquals (
            'test.icosTokenWrapper.balanceOf (test.bob.address)',
            100,
            test.icosTokenWrapper.balanceOf (test.bob.address));
      }},
    { name: "Bob allows Dave to transfer 50 of his tokens",
      body: function (test) {
        assertBNEquals (
            'test.icosTokenWrapper.allowance (test.bob.address, test.dave.address)',
            0,
            test.icosTokenWrapper.allowance (test.bob.address, test.dave.address));

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.icosTokenWrapper.address,
          test.icosTokenWrapper.approve['address,uint256'].getData (
            test.dave.address, 50),
          0,
          {from: test.alice, gas:1000000});
      }},
    { name: "Make sure transaction succeeded",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.bob.Result",
          test.bob,
          test.bob.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.icosTokenWrapper.Approval",
          test.icosTokenWrapper,
          test.icosTokenWrapper.Approval,
          test.tx,
          { _owner: test.bob.address, _spender: test.dave.address, _value: 50 });

        assertBNEquals (
            'test.icosTokenWrapper.allowance (test.bob.address, test.dave.address)',
            50,
            test.icosTokenWrapper.allowance (test.bob.address, test.dave.address));
      }},
    { name: "Bob tries to allow Dave to transfer 70 of his tokens assuming that current allowance is 49, which is wrong",
      body: function (test) {
        assertBNEquals (
            'test.icosTokenWrapper.allowance (test.bob.address, test.dave.address)',
            50,
            test.icosTokenWrapper.allowance (test.bob.address, test.dave.address));

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.icosTokenWrapper.address,
          test.icosTokenWrapper.approve['address,uint256,uint256'].getData (
            test.dave.address, 49, 70),
          0,
          {from: test.alice, gas:1000000});
      }},
    { name: "Make sure transaction succeeded but allowance was not changed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.bob.Result",
          test.bob,
          test.bob.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.icosTokenWrapper.Result",
          test.icosTokenWrapper,
          test.icosTokenWrapper.Result,
          test.tx,
          { _value: false });

        assertEvents (
          "test.icosTokenWrapper.Approval",
          test.icosTokenWrapper,
          test.icosTokenWrapper.Approval,
          test.tx);

        assertBNEquals (
            'test.icosTokenWrapper.allowance (test.bob.address, test.dave.address)',
            50,
            test.icosTokenWrapper.allowance (test.bob.address, test.dave.address));
      }},
    { name: "Bob allows Dave to transfer 70 of his tokens assuming that current allowance is 50",
      body: function (test) {
        assertBNEquals (
            'test.icosTokenWrapper.allowance (test.bob.address, test.dave.address)',
            50,
            test.icosTokenWrapper.allowance (test.bob.address, test.dave.address));

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.icosTokenWrapper.address,
          test.icosTokenWrapper.approve['address,uint256,uint256'].getData (
            test.dave.address, 50, 70),
          0,
          {from: test.alice, gas:1000000});
      }},
    { name: "Make sure transaction succeeded",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.bob.Result",
          test.bob,
          test.bob.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.icosTokenWrapper.Result",
          test.icosTokenWrapper,
          test.icosTokenWrapper.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.icosTokenWrapper.Approval",
          test.icosTokenWrapper,
          test.icosTokenWrapper.Approval,
          test.tx,
          { _owner: test.bob.address, _spender: test.dave.address, _value: 70 });

        assertBNEquals (
            'test.icosTokenWrapper.allowance (test.bob.address, test.dave.address)',
            70,
            test.icosTokenWrapper.allowance (test.bob.address, test.dave.address));
      }},
    { name: "Bob transfers one token to Carol",
      body: function (test) {
        assertBNEquals (
            'test.icosTokenWrapper.balanceOf (test.bob.address)',
            100,
            test.icosTokenWrapper.balanceOf (test.bob.address));

        assertBNEquals (
            'test.icosTokenWrapper.balanceOf (test.carol.address)',
            0,
            test.icosTokenWrapper.balanceOf (test.carol.address));

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.icosTokenWrapper.address,
          test.icosTokenWrapper.transfer.getData (
            test.carol.address, 1),
          0,
          {from: test.alice, gas:1000000});
      }},
    { name: "Make sure transaction succeeded",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.bob.Result",
          test.bob,
          test.bob.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.icosTokenWrapper.Result",
          test.icosTokenWrapper,
          test.icosTokenWrapper.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.icosTokenWrapper.Transfer",
          test.icosTokenWrapper,
          test.icosTokenWrapper.Transfer,
          test.tx,
          { _from: test.bob.address, _to: test.carol.address, _value: 1 });

        assertBNEquals (
            'test.icosTokenWrapper.balanceOf (test.bob.address)',
            99,
            test.icosTokenWrapper.balanceOf (test.bob.address));

        assertBNEquals (
            'test.icosTokenWrapper.balanceOf (test.carol.address)',
            1,
            test.icosTokenWrapper.balanceOf (test.carol.address));
      }},
    { name: "Dave transfers one Bob's token to Carol",
      body: function (test) {
        assertBNEquals (
            'test.icosTokenWrapper.balanceOf (test.bob.address)',
            99,
            test.icosTokenWrapper.balanceOf (test.bob.address));

        assertBNEquals (
            'test.icosTokenWrapper.balanceOf (test.carol.address)',
            1,
            test.icosTokenWrapper.balanceOf (test.carol.address));

        assertBNEquals (
            'test.icosTokenWrapper.allowance (test.bob.address, test.dave.address)',
            70,
            test.icosTokenWrapper.allowance (test.bob.address, test.dave.address));

        personal.unlockAccount (test.alice, "");
        test.tx = test.dave.execute (
          test.icosTokenWrapper.address,
          test.icosTokenWrapper.transferFrom.getData (
            test.bob.address, test.carol.address, 1),
          0,
          {from: test.alice, gas:1000000});
      }},
    { name: "Make sure transaction succeeded",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.dave.Result",
          test.dave,
          test.dave.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.icosTokenWrapper.Result",
          test.icosTokenWrapper,
          test.icosTokenWrapper.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.icosTokenWrapper.Transfer",
          test.icosTokenWrapper,
          test.icosTokenWrapper.Transfer,
          test.tx,
          { _from: test.bob.address, _to: test.carol.address, _value: 1 });

        assertBNEquals (
            'test.icosTokenWrapper.balanceOf (test.bob.address)',
            98,
            test.icosTokenWrapper.balanceOf (test.bob.address));

        assertBNEquals (
            'test.icosTokenWrapper.balanceOf (test.carol.address)',
            2,
            test.icosTokenWrapper.balanceOf (test.carol.address));

        assertBNEquals (
            'test.icosTokenWrapper.allowance (test.bob.address, test.dave.address)',
            69,
            test.icosTokenWrapper.allowance (test.bob.address, test.dave.address));
      }},
    { name: "Bob tries to freeze transfers but he is not the owner of smart contract",
      body: function (test) {
        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.icosTokenWrapper.address,
          test.icosTokenWrapper.freezeTransfers.getData (),
          0,
          {from: test.alice, gas:1000000});
      }},
    { name: "Make sure transaction failed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.bob.Result",
          test.bob,
          test.bob.Result,
          test.tx,
          { _value: false });

        assertEvents (
          "test.icosTokenWrapper.Freeze",
          test.icosTokenWrapper,
          test.icosTokenWrapper.Freeze,
          test.tx);
      }},
    { name: "Carol freezes transfers",
      body: function (test) {
        personal.unlockAccount (test.alice, "");
        test.tx = test.carol.execute (
          test.icosTokenWrapper.address,
          test.icosTokenWrapper.freezeTransfers.getData (),
          0,
          {from: test.alice, gas:1000000});
      }},
    { name: "Make sure transaction succeeded",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.carol.Result",
          test.carol,
          test.carol.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.icosTokenWrapper.Freeze",
          test.icosTokenWrapper,
          test.icosTokenWrapper.Freeze,
          test.tx,
          {});
      }},
    { name: "Carol tries to freezes transfers but they are already frozen",
      body: function (test) {
        personal.unlockAccount (test.alice, "");
        test.tx = test.carol.execute (
          test.icosTokenWrapper.address,
          test.icosTokenWrapper.freezeTransfers.getData (),
          0,
          {from: test.alice, gas:1000000});
      }},
    { name: "Make sure transaction succeeded, but no events were logged",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.carol.Result",
          test.carol,
          test.carol.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.icosTokenWrapper.Freeze",
          test.icosTokenWrapper,
          test.icosTokenWrapper.Freeze,
          test.tx);
      }},
    { name: "Bob tries to transfer one token to Carol but transfers are frozen",
      body: function (test) {
        assertBNEquals (
            'test.icosTokenWrapper.balanceOf (test.bob.address)',
            98,
            test.icosTokenWrapper.balanceOf (test.bob.address));

        assertBNEquals (
            'test.icosTokenWrapper.balanceOf (test.carol.address)',
            2,
            test.icosTokenWrapper.balanceOf (test.carol.address));

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.icosTokenWrapper.address,
          test.icosTokenWrapper.transfer.getData (
            test.carol.address, 1),
          0,
          {from: test.alice, gas:1000000});
      }},
    { name: "Make sure transaction succeeded but no tokens were transferred",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.bob.Result",
          test.bob,
          test.bob.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.icosTokenWrapper.Result",
          test.icosTokenWrapper,
          test.icosTokenWrapper.Result,
          test.tx,
          { _value: false });

        assertEvents (
          "test.icosTokenWrapper.Transfer",
          test.icosTokenWrapper,
          test.icosTokenWrapper.Transfer,
          test.tx);

        assertBNEquals (
            'test.icosTokenWrapper.balanceOf (test.bob.address)',
            98,
            test.icosTokenWrapper.balanceOf (test.bob.address));

        assertBNEquals (
            'test.icosTokenWrapper.balanceOf (test.carol.address)',
            2,
            test.icosTokenWrapper.balanceOf (test.carol.address));
      }},
    { name: "Dave tries to transfer one Bob's token to Carol but token transfers are frozen",
      body: function (test) {
        assertBNEquals (
            'test.icosTokenWrapper.balanceOf (test.bob.address)',
            98,
            test.icosTokenWrapper.balanceOf (test.bob.address));

        assertBNEquals (
            'test.icosTokenWrapper.balanceOf (test.carol.address)',
            2,
            test.icosTokenWrapper.balanceOf (test.carol.address));

        assertBNEquals (
            'test.icosTokenWrapper.allowance (test.bob.address, test.dave.address)',
            69,
            test.icosTokenWrapper.allowance (test.bob.address, test.dave.address));

        personal.unlockAccount (test.alice, "");
        test.tx = test.dave.execute (
          test.icosTokenWrapper.address,
          test.icosTokenWrapper.transferFrom.getData (
            test.bob.address, test.carol.address, 1),
          0,
          {from: test.alice, gas:1000000});
      }},
    { name: "Make sure transaction succeeded but no tokens were transferred",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.dave.Result",
          test.dave,
          test.dave.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.icosTokenWrapper.Result",
          test.icosTokenWrapper,
          test.icosTokenWrapper.Result,
          test.tx,
          { _value: false });

        assertEvents (
          "test.icosTokenWrapper.Transfer",
          test.icosTokenWrapper,
          test.icosTokenWrapper.Transfer,
          test.tx);

        assertBNEquals (
            'test.icosTokenWrapper.balanceOf (test.bob.address)',
            98,
            test.icosTokenWrapper.balanceOf (test.bob.address));

        assertBNEquals (
            'test.icosTokenWrapper.balanceOf (test.carol.address)',
            2,
            test.icosTokenWrapper.balanceOf (test.carol.address));

        assertBNEquals (
            'test.icosTokenWrapper.allowance (test.bob.address, test.dave.address)',
            69,
            test.icosTokenWrapper.allowance (test.bob.address, test.dave.address));
      }},
    { name: "Bob tries to unfreeze transfers but he is not the owner of smart contract",
      body: function (test) {
        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.icosTokenWrapper.address,
          test.icosTokenWrapper.unfreezeTransfers.getData (),
          0,
          {from: test.alice, gas:1000000});
      }},
    { name: "Make sure transaction failed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.bob.Result",
          test.bob,
          test.bob.Result,
          test.tx,
          { _value: false });

        assertEvents (
          "test.icosTokenWrapper.Unfreeze",
          test.icosTokenWrapper,
          test.icosTokenWrapper.Unfreeze,
          test.tx);
      }},
    { name: "Carol unfreezes transfers",
      body: function (test) {
        personal.unlockAccount (test.alice, "");
        test.tx = test.carol.execute (
          test.icosTokenWrapper.address,
          test.icosTokenWrapper.unfreezeTransfers.getData (),
          0,
          {from: test.alice, gas:1000000});
      }},
    { name: "Make sure transaction succeeded",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.carol.Result",
          test.carol,
          test.carol.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.icosTokenWrapper.Unfreeze",
          test.icosTokenWrapper,
          test.icosTokenWrapper.Unfreeze,
          test.tx,
          {});
      }},
    { name: "Carol tries to unfreezes transfers but they are already unfrozen",
      body: function (test) {
        personal.unlockAccount (test.alice, "");
        test.tx = test.carol.execute (
          test.icosTokenWrapper.address,
          test.icosTokenWrapper.unfreezeTransfers.getData (),
          0,
          {from: test.alice, gas:1000000});
      }},
    { name: "Make sure transaction succeeded, but no events were logged",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.carol.Result",
          test.carol,
          test.carol.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.icosTokenWrapper.Unfreeze",
          test.icosTokenWrapper,
          test.icosTokenWrapper.Unfreeze,
          test.tx);
      }},
    { name: "Bob transfers one token to Carol",
      body: function (test) {
        assertBNEquals (
            'test.icosTokenWrapper.balanceOf (test.bob.address)',
            98,
            test.icosTokenWrapper.balanceOf (test.bob.address));

        assertBNEquals (
            'test.icosTokenWrapper.balanceOf (test.carol.address)',
            2,
            test.icosTokenWrapper.balanceOf (test.carol.address));

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.icosTokenWrapper.address,
          test.icosTokenWrapper.transfer.getData (
            test.carol.address, 1),
          0,
          {from: test.alice, gas:1000000});
      }},
    { name: "Make sure transaction succeeded",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.bob.Result",
          test.bob,
          test.bob.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.icosTokenWrapper.Result",
          test.icosTokenWrapper,
          test.icosTokenWrapper.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.icosTokenWrapper.Transfer",
          test.icosTokenWrapper,
          test.icosTokenWrapper.Transfer,
          test.tx,
          { _from: test.bob.address, _to: test.carol.address, _value: 1 });

        assertBNEquals (
            'test.icosTokenWrapper.balanceOf (test.bob.address)',
            97,
            test.icosTokenWrapper.balanceOf (test.bob.address));

        assertBNEquals (
            'test.icosTokenWrapper.balanceOf (test.carol.address)',
            3,
            test.icosTokenWrapper.balanceOf (test.carol.address));
      }},
    { name: "Dave transfers one Bob's token to Carol",
      body: function (test) {
        assertBNEquals (
            'test.icosTokenWrapper.balanceOf (test.bob.address)',
            97,
            test.icosTokenWrapper.balanceOf (test.bob.address));

        assertBNEquals (
            'test.icosTokenWrapper.balanceOf (test.carol.address)',
            3,
            test.icosTokenWrapper.balanceOf (test.carol.address));

        assertBNEquals (
            'test.icosTokenWrapper.allowance (test.bob.address, test.dave.address)',
            69,
            test.icosTokenWrapper.allowance (test.bob.address, test.dave.address));

        personal.unlockAccount (test.alice, "");
        test.tx = test.dave.execute (
          test.icosTokenWrapper.address,
          test.icosTokenWrapper.transferFrom.getData (
            test.bob.address, test.carol.address, 1),
          0,
          {from: test.alice, gas:1000000});
      }},
    { name: "Make sure transaction succeeded",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.dave.Result",
          test.dave,
          test.dave.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.icosTokenWrapper.Result",
          test.icosTokenWrapper,
          test.icosTokenWrapper.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.icosTokenWrapper.Transfer",
          test.icosTokenWrapper,
          test.icosTokenWrapper.Transfer,
          test.tx,
          { _from: test.bob.address, _to: test.carol.address, _value: 1 });

        assertBNEquals (
            'test.icosTokenWrapper.balanceOf (test.bob.address)',
            96,
            test.icosTokenWrapper.balanceOf (test.bob.address));

        assertBNEquals (
            'test.icosTokenWrapper.balanceOf (test.carol.address)',
            4,
            test.icosTokenWrapper.balanceOf (test.carol.address));

        assertBNEquals (
            'test.icosTokenWrapper.allowance (test.bob.address, test.dave.address)',
            68,
            test.icosTokenWrapper.allowance (test.bob.address, test.dave.address));
      }}
  ]});
