import { BigNumberish } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethers, upgrades } from "hardhat";
import { parseEther, keccak256 } from "../helpers/ether-helper";
import { Contract } from "ethers";
import constants from "../helpers/constants";
describe("FLPCrowdSale", function () {
  const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
  const WITHDRAWER_ROLE = keccak256("WITHDRAWER_ROLE");
  const PAUSER_ROLE = keccak256("PAUSER_ROLE");
  const UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
  async function deployFLPCrowdSaleFixture() {
    const [deployer, receiver] = await ethers.getSigners();
    const paymentTokenFactory = await ethers.getContractFactory(
      "USDT",
      deployer
    );
    const paymentTokenContract = await paymentTokenFactory.deploy();
    await paymentTokenContract.deployed();
    const icoTokenFactory = await ethers.getContractFactory("Floppy", deployer);
    const icoTokenContract: Contract = await icoTokenFactory.deploy();
    await icoTokenContract.deployed();
    const nativeRate: number = 0.005; // 0.005 token/native =  meanings 1 ICO token = 0.005 native token
    const tokenRate: number = 0.7; // meanings 1 ICO token = 0.7 erc20 token
    // deploy crowdSale contract
    const crowdSaleFactory = await ethers.getContractFactory(
      "FLPCrowdsale",
      deployer
    );
	const params = [
		nativeRate * constants.PERCENTAGE_FRACTION,
		tokenRate * constants.PERCENTAGE_FRACTION,
		paymentTokenContract.address,
		receiver.address,
		icoTokenContract.address
	]
    const crowdSaleContract: Contract = await upgrades.deployProxy(crowdSaleFactory, params);
    await crowdSaleContract.deployed();
    return {
      owner: deployer,
      receiver,
      nativeRate,
      tokenRate,
      icoTokenContract,
      crowdSaleContract,
      paymentTokenContract,
    };
  }
  describe("Deployment", function () {
    it("set the `_tokenRate` to `token_rate`, type unit256", async function () {
      const { tokenRate, crowdSaleContract } = await loadFixture(
        deployFLPCrowdSaleFixture
      );
      expect(await crowdSaleContract.token_rate()).to.equal(
        tokenRate * constants.PERCENTAGE_FRACTION
      );
    });
    it("set the `_nativeRate` to `native_rate`, type unit256", async function () {
      const { nativeRate, crowdSaleContract } = await loadFixture(
        deployFLPCrowdSaleFixture
      );
      expect(await crowdSaleContract.native_rate()).to.equal(
        nativeRate * constants.PERCENTAGE_FRACTION
      );
    });
    it("set the `_paymentToken` to `payment_token`, type IERC20", async function () {
      const { paymentTokenContract, crowdSaleContract } = await loadFixture(
        deployFLPCrowdSaleFixture
      );
      expect(await crowdSaleContract.payment_token()).to.equal(
        paymentTokenContract.address
      );
    });
    it("set the `_icoToken` to `ico_token`, type IERC20", async function () {
      const { icoTokenContract, crowdSaleContract } = await loadFixture(
        deployFLPCrowdSaleFixture
      );
      expect(await crowdSaleContract.ico_token()).to.equal(
        icoTokenContract.address
      );
    });
    it("set the `_receiver` to `receiver_address`, type address", async function () {
      const { receiver, crowdSaleContract } = await loadFixture(
        deployFLPCrowdSaleFixture
      );
      expect(await crowdSaleContract.receiver_address()).to.equal(
        receiver.address
      );
    });
    it("set the deployer has role admin", async function () {
      const { owner, crowdSaleContract } = await loadFixture(
        deployFLPCrowdSaleFixture
      );
      expect(await crowdSaleContract.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.equal(true);
    });
    it("set the deployer has role pauser", async function () {
      const { owner, crowdSaleContract } = await loadFixture(
        deployFLPCrowdSaleFixture
      );
      expect(await crowdSaleContract.hasRole(PAUSER_ROLE, owner.address)).to.equal(true);
    });
    it("set the deployer has role upgrader", async function () {
      const { owner, crowdSaleContract } = await loadFixture(
        deployFLPCrowdSaleFixture
      );
      expect(await crowdSaleContract.hasRole(UPGRADER_ROLE, owner.address)).to.equal(true);
    });
    it("set the deployer has role withdrawer", async function () {
      const { owner, crowdSaleContract } = await loadFixture(
        deployFLPCrowdSaleFixture
      );
      expect(await crowdSaleContract.hasRole(WITHDRAWER_ROLE, owner.address)).to.equal(true);
    });
  });
  describe("ACL call", function () {
	const getErrorACL = (address: string, role: string) => {
		return `AccessControl: account ${address.toLowerCase()} is missing role ${role}`
	}
    let owner: SignerWithAddress,
      paymentTokenContract: Contract,
      crowdSaleContract: Contract;
    beforeEach(async function () {
      ({ owner, paymentTokenContract, crowdSaleContract } = await loadFixture(
        deployFLPCrowdSaleFixture
      ));
    });
    describe("setPaymentToken(IERC20)", function () {
      let mockToken: Contract;
      beforeEach(async function () {
        const mockTokenFactory = await ethers.getContractFactory(
          "Floppy",
          owner
        );
        mockToken = await mockTokenFactory.deploy();
        await mockToken.deployed();
      });
      it("and caller does not have admin role => reverted", async function () {
        const [, , caller] = await ethers.getSigners();
        await expect(
          crowdSaleContract.connect(caller).setPaymentToken(mockToken.address)
        ).to.be.revertedWith(getErrorACL(caller.address, DEFAULT_ADMIN_ROLE));
      });
      it("and caller has role admin => success", async function () {
        const [, , caller] = await ethers.getSigners();
		const _grantTx = await crowdSaleContract.connect(owner).grantRole(DEFAULT_ADMIN_ROLE, caller.address)
		await _grantTx.wait();
		await expect(
          crowdSaleContract.connect(caller).setPaymentToken(mockToken.address)
        )
          .to.emit(crowdSaleContract, "PaymentTokenChanged")
          .withArgs(mockToken.address);
        expect(await crowdSaleContract.payment_token()).to.equal(
          mockToken.address
        );
      });
    });
    describe("setNativeRate(uint256)", function () {
      let nativeRate: BigNumberish;
      beforeEach(function () {
        nativeRate = parseEther(0.5);
      });
      it("and caller doesn't have admin role => reverted", async function () {
        const [, , caller] = await ethers.getSigners();
        await expect(
          crowdSaleContract.connect(caller).setNativeRate(nativeRate)
        ).to.be.revertedWith(getErrorACL(caller.address, DEFAULT_ADMIN_ROLE));
      });
      it("and caller has admin role => success", async function () {
        const [, , caller] = await ethers.getSigners();
		const _grantTx = await crowdSaleContract.connect(owner).grantRole(DEFAULT_ADMIN_ROLE, caller.address)
		await _grantTx.wait();
        await expect(crowdSaleContract.connect(caller).setNativeRate(nativeRate))
          .to.emit(crowdSaleContract, "NativeRateChanged")
          .withArgs(nativeRate);
        expect(await crowdSaleContract.native_rate()).to.equal(nativeRate);
      });
    });
    describe("setTokenRate(uint256)", function () {
      let tokenRate: BigNumberish;
      beforeEach(function () {
        tokenRate = parseEther(0.5);
      });
      it("and caller does not have admin role => reverted", async function () {
        const [, , caller] = await ethers.getSigners();
        await expect(
          crowdSaleContract.connect(caller).setTokenRate(tokenRate)
        ).to.be.revertedWith(getErrorACL(caller.address, DEFAULT_ADMIN_ROLE));
      });
      it("and caller has admin role => success", async function () {
        const [, , caller] = await ethers.getSigners();
		const _grantTx = await crowdSaleContract.connect(owner).grantRole(DEFAULT_ADMIN_ROLE, caller.address)
		await _grantTx.wait();
        await expect(crowdSaleContract.connect(caller).setTokenRate(tokenRate))
          .to.emit(crowdSaleContract, "TokenRateChanged")
          .withArgs(tokenRate);
        expect(await crowdSaleContract.token_rate()).to.equal(tokenRate);
      });
    });
    describe("setReceiverAddress(address)", function () {
      let receiver: SignerWithAddress;
      beforeEach(async function () {
        [, , receiver] = await ethers.getSigners();
      });
      it("and caller does not have admin role => rejected", async function () {
        const [, , , caller] = await ethers.getSigners();
        await expect(
          crowdSaleContract.connect(caller).setReceiverAddress(receiver.address)
        ).to.be.revertedWith(getErrorACL(caller.address, DEFAULT_ADMIN_ROLE));
      });
      it("and caller has admin role => success", async function () {
        const [, , caller] = await ethers.getSigners();
		const _grantTx = await crowdSaleContract.connect(owner).grantRole(DEFAULT_ADMIN_ROLE, caller.address)
		await _grantTx.wait();
        await expect(
          crowdSaleContract.connect(caller).setReceiverAddress(receiver.address)
        )
          .to.emit(crowdSaleContract, "ReceiverAddressChanged")
          .withArgs(receiver.address);
        expect(await crowdSaleContract.receiver_address()).to.equal(
          receiver.address
        );
      });
    });
    describe("withdrawNative()", function () {
      const ERROR_BALANCE_IS_ZERO = "Withdraw: Balance is zero";
      it("and caller does not have withdrawer role => rejected", async function () {
        const [, , , caller] = await ethers.getSigners();
        await expect(
          crowdSaleContract.connect(caller).withdrawNative()
        ).to.be.revertedWith(getErrorACL(caller.address, WITHDRAWER_ROLE));
      });
      it("and caller has withdrawer role and balance is zero => rejected", async function () {
        const [, , caller] = await ethers.getSigners();
		const _grantTx = await crowdSaleContract.connect(owner).grantRole(WITHDRAWER_ROLE, caller.address)
		await _grantTx.wait();
        await expect(
          crowdSaleContract.connect(caller).withdrawNative()
        ).to.be.revertedWith(ERROR_BALANCE_IS_ZERO);
      });
      it("and caller has withdrawer role and balance is larger than zero => success", async function () {
        const [, , , sender, caller] = await ethers.getSigners();
		const _grantTx = await crowdSaleContract.connect(owner).grantRole(WITHDRAWER_ROLE, caller.address)
		await _grantTx.wait();
        await sender.sendTransaction({
          to: crowdSaleContract.address,
          value: 500,
        });
        await expect(
          await crowdSaleContract.connect(caller).withdrawNative()
        ).to.changeEtherBalances(
          [caller.address, crowdSaleContract.address],
          [+500, -500]
        );
      });
    });
    describe("withdrawToken()", function () {
      const ERROR_AMOUNT_TOKEN_IS_ZERO = "Withdraw: Token's amount is zero";
      it("and caller does not have withdrawer role => rejected", async function () {
        const [, , , caller] = await ethers.getSigners();
        await expect(
          crowdSaleContract.connect(caller).withdrawNative()
        ).to.be.revertedWith(getErrorACL(caller.address, WITHDRAWER_ROLE));
      });
      it("and caller has withdrawer role and amount of token is zero => rejected", async function () {
        const [, , caller] = await ethers.getSigners();
		const _grantTx = await crowdSaleContract.connect(owner).grantRole(WITHDRAWER_ROLE, caller.address)
		await _grantTx.wait();
        await expect(
          crowdSaleContract.connect(caller).withdrawToken()
        ).to.be.revertedWith(ERROR_AMOUNT_TOKEN_IS_ZERO);
      });
      it("and caller has withdrawer role and amount of token is larger than zero => success", async function () {
        const [, , , caller] = await ethers.getSigners();
		const _grantTx = await crowdSaleContract.connect(owner).grantRole(WITHDRAWER_ROLE, caller.address)
		await _grantTx.wait();
        await paymentTokenContract.transfer(crowdSaleContract.address, 500);
        await expect(
          await crowdSaleContract.connect(caller).withdrawToken()
        ).to.changeTokenBalances(
          paymentTokenContract,
          [caller.address, crowdSaleContract.address],
          [+500, -500]
        );
      });
    });
  });
  describe("External call", function () {
    const ERROR_AMOUNT_IS_ZERO = "Amount is zero";
    const ERROR_INSUFFICIENT_BALANCE = "Insufficient account balance";
    let nativeRate: number,
      tokenRate: number,
      crowdSaleContract: Contract,
      paymentTokenContract: Contract,
      caller: SignerWithAddress,
      receiver: SignerWithAddress,
      owner: SignerWithAddress,
      icoTokenContract: Contract;
    beforeEach(async function () {
      [, , caller] = await ethers.getSigners();
      ({
        nativeRate,
        crowdSaleContract,
        paymentTokenContract,
        icoTokenContract,
        tokenRate,
        receiver,
        owner,
      } = await loadFixture(deployFLPCrowdSaleFixture));

      const sentTx = await icoTokenContract
        .connect(owner)
        .transfer(crowdSaleContract.address, parseEther(50000));
	  await sentTx.wait();
    });
    describe("buyByNative()", function () {
      it("requested 0 token amount => rejected", async function () {
        await expect(
          crowdSaleContract.connect(caller).buyByNative({ value: 0 })
        ).to.be.rejectedWith(ERROR_AMOUNT_IS_ZERO);
      });
      it("number of `ico_token` requested exceeds number of currently token amount => rejected", async function () {
        const tokenAmount = await icoTokenContract.balanceOf(crowdSaleContract.address);
        const nativeAmountEnought = tokenAmount.mul(nativeRate*constants.PERCENTAGE_FRACTION).div(constants.PERCENTAGE_FRACTION);
		const nativeAmountExceeds = nativeAmountEnought.add(1000);
		await expect(
          crowdSaleContract
            .connect(caller)
            .buyByNative({ value: nativeAmountExceeds })
        ).to.be.rejectedWith(ERROR_INSUFFICIENT_BALANCE);
      });
      describe("buy ICO token by native => success", function () {
        const nativeBought = 1;
        it("sent native amount from `caller` to `receiver_address` wallet", async function () {
          await expect(
            crowdSaleContract
              .connect(caller)
              .buyByNative({ value: parseEther(nativeBought) })
          ).to.changeEtherBalances(
            [caller.address, receiver.address],
            [`-${parseEther(nativeBought)}`, parseEther(nativeBought) ]
          );
        });
        it("sent `ico_token` amount from `crowd sale contract` to `caller` wallet", async function () {
          await expect(
            crowdSaleContract
              .connect(caller)
              .buyByNative({ value: parseEther(nativeBought) })
          ).to.changeTokenBalances(
            icoTokenContract,
            [crowdSaleContract.address, caller.address],
            [`-${parseEther(nativeBought/nativeRate)}`, parseEther(nativeBought/nativeRate)]
          );
        });
      });
    });
    describe("buyByToken(uint256)", function () {
	  beforeEach(async function () {
		const sentTx = await paymentTokenContract.connect(owner).transfer(caller.address, parseEther(1000));
		await sentTx;
	  })
      it("requested 0 token amount => rejected", async function () {
        await expect(
          crowdSaleContract.connect(caller).buyByToken(0)
        ).to.be.rejectedWith(ERROR_AMOUNT_IS_ZERO);
      });
      it("number of `ico_token` requested exceeds number of currently token amount => rejected", async function () {
        const tokenICOAmount = await icoTokenContract.balanceOf(
          crowdSaleContract.address
        );
        const pmtTokenAmountEnough = tokenICOAmount.mul(tokenRate*constants.PERCENTAGE_FRACTION).div(constants.PERCENTAGE_FRACTION);
		const pmtTokenAmountExceed = pmtTokenAmountEnough.add(1000);
        await expect(
          crowdSaleContract
            .connect(caller)
            .buyByToken(pmtTokenAmountExceed)
        ).to.be.rejectedWith(ERROR_INSUFFICIENT_BALANCE);
      });
      it("argument `_amount` larger than `payment_token` amount of caller => rejected", async function () {
        const tokenOfCaller = await paymentTokenContract.balanceOf(
          caller.address
        );
        await expect(
          crowdSaleContract.connect(caller).buyByToken(tokenOfCaller.add(1000))
        ).to.be.rejectedWith(ERROR_INSUFFICIENT_BALANCE);
      });
      describe("buy ICO token by token => success", function () {
        let tokenBought = 70;
		beforeEach(async function(){
			const approveTx = await paymentTokenContract.connect(caller).approve(crowdSaleContract.address, parseEther(tokenBought));
			await approveTx.wait();
		})
        it("sent `payment_token` amount from `caller` to `receiver_address` wallet", async function () {
          await expect(
            crowdSaleContract.connect(caller).buyByToken(parseEther(tokenBought))
          ).to.changeTokenBalances(
            paymentTokenContract,
            [caller.address, receiver.address],
            [`-${parseEther(tokenBought)}`, parseEther(tokenBought)]
          );
        });
        it("sent `ico_token` amount from `contract` to `caller` wallet", async function () {
          await expect(
            crowdSaleContract.connect(caller).buyByToken(parseEther(tokenBought))
          ).to.changeTokenBalances(
            icoTokenContract,
            [crowdSaleContract.address, caller.address],
            [`-${parseEther(tokenBought / tokenRate)}`, parseEther(tokenBought / tokenRate)],
          );
        });
      });
    });
  });
  describe("Upgradable pattern", function () {});
  describe("Security audit", function () {});
});
