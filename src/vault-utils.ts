import {
  LiquidatePosition as LiquidatePositionEvent,
  RegisterLiquidation
} from "../generated/LiquidateVault/LiquidateVault"
import {
  IncreaseOpenInterest,
  DecreaseOpenInterest,
  UpdateFunding
} from "../generated/SettingsManager/SettingsManager"
import { 
  process24HVolume, 
  processAllTrades,
  processDailyTrades,
  processHourlyTrades,
  processMonthlyTrades,
  processWeeklyTrades,
  processUserTradeStats,
  processGlobalInfo
} from "./process"
import {
  Mint as MintEvent,
  Burn as BurnEvent
  } from "../generated/VUSD/VUSD"

import {
    AllTrade,
    BaseGlobalInfo,
    BaseUserInfo,
    ClosePosition,
    DailyTrade,
    DailyGlobalInfo,
    Deposit,
    HourlyTrade,
    Mint,
    MonthlyTrade,
    LiquidatePosition,
    OpenInterest,
    PositionStat,
    PositionTrigger,
    Redeem,
    Trigger,
    TradeVolume,
    UserStakingStat,
    UserStakingTier,
    StrandedUSDCAmount,
    Withdraw,
    WeeklyTrade,
    ReferFee,
    HourlyVolume,
    HyperStakingTier,
    TotalInfo,
    TokenConfig,
    Token,
    PlatformFee
  } from "../generated/schema"
import {
    Deposit as DepositEvent,
    PlatformFeeTransfer as PlatformFeeTransferEvent,
    ReferFeeTransfer as ReferFeeTransferEvent,
    ReferFeeTraderRebate as ReferFeeTraderRebateEvent,
    Stake as StakeEvent,
    Unstake as UnstakeEvent,
    Withdraw as WithdrawEvent
  } from "../generated/Vault/Vault"
import { BigInt } from "@graphprotocol/graph-ts"
import { VLP_DECIMALS, MAX_VLP_FOR_Hyper, 
    BIG_NUM_ZERO,
    getDayStartDate,
    getHourStartDate,
    getWeekStartDate,
    getMonthStartDate,
    HYPER_END_TIME,
    getAccountDailyTradesId,
    getAccountHourlyTradesId,
    getAccountMonthlyTradesId,
    getAccountWeeklyTradesId,
    HYPER_ONE_WALLETS,
    ZERO_ADDRESS
  } from "./constants"

import {
  AddTrailingStop,
  AddTriggerOrders,
  ExecuteTriggerOrders,
  EditTriggerOrder,
  NewOrder,
  FinishOrder as FinishOrderEvent,
  UpdateOrder as UpdateOrderEvent,
  UpdateTrailingStop,
  UpdateTriggerOrderStatus
} from "../generated/OrderVault/OrderVault" 

const getRewardTier= (vlpAmount: BigInt, totalVLP: BigInt): i32 => {
  if ((totalVLP.plus(vlpAmount)).lt(BigInt.fromString('1000000').times(VLP_DECIMALS))) {
    return 1
  } else if ((totalVLP.plus(vlpAmount)).lt(BigInt.fromString('3000000').times(VLP_DECIMALS))) {
    return 2
  } else if ((totalVLP.plus(vlpAmount)).lt(BigInt.fromString('6000000').times(VLP_DECIMALS))) {
    return 3
  } else if ((totalVLP.plus(vlpAmount)).lt(BigInt.fromString('10000000').times(VLP_DECIMALS))) {
    return 4
  } else if ((totalVLP.plus(vlpAmount)).le(BigInt.fromString('20000000').times(VLP_DECIMALS))) {
    return 5
  } else {
    return 0
  }
}

const getBaseVLP = (rewardTier: i32): BigInt => {
  switch(rewardTier) {
    case 1:
      return BigInt.fromString('1000000').times(VLP_DECIMALS)
    case 2:
      return BigInt.fromString('3000000').times(VLP_DECIMALS)
    case 3:
      return BigInt.fromString('6000000').times(VLP_DECIMALS)
    case 4:
      return BigInt.fromString('10000000').times(VLP_DECIMALS)
    case 5:
      return BigInt.fromString('20000000').times(VLP_DECIMALS)
    default:
      return BigInt.fromString('0')
  }
}

const getRewardAmount2 = (rewardTier: i32): BigInt => {
  switch(rewardTier) {
    case 1:
      return BigInt.fromString('100')
    case 2:
      return BigInt.fromString('80')
    case 3:
      return BigInt.fromString('60')
    case 4:
      return BigInt.fromString('45')
    case 5:
      return BigInt.fromString('38')
    default:
      return BigInt.fromString('0')
  }
}

  export function handleDeposit(event: DepositEvent): void {
    let deposit = new Deposit(event.params.account.toHexString() + "-" + event.block.timestamp.toString())
    deposit.amount = event.params.amount
    deposit.account = event.params.account.toHexString()
    deposit.createdAt = event.block.timestamp.toI32()
    deposit.trasactionHash = event.transaction.hash.toHexString()
    deposit.save()

    let totalInfos = TotalInfo.load("all") 
    if (!totalInfos) {
      totalInfos = new TotalInfo("all")
      totalInfos.totalDeposits = BIG_NUM_ZERO
      totalInfos.totalWithdraws = BIG_NUM_ZERO
    }
    totalInfos.totalDeposits = totalInfos.totalDeposits.plus(event.params.amount)
    totalInfos.save()    
  }

  export function handleWithdraw(event: WithdrawEvent): void {
    let withdraw = new Withdraw(event.params.account.toHexString() + "-" + event.block.timestamp.toString())
    withdraw.amount = event.params.amount
    withdraw.account = event.params.account.toHexString()
    withdraw.createdAt = event.block.timestamp.toI32()
    withdraw.trasactionHash = event.transaction.hash.toHexString()
    withdraw.save()
    let totalInfos = TotalInfo.load("all") 
    if (!totalInfos) {
      totalInfos = new TotalInfo("all")
      totalInfos.totalDeposits = BIG_NUM_ZERO
      totalInfos.totalWithdraws = BIG_NUM_ZERO
    }
    totalInfos.totalWithdraws = totalInfos.totalWithdraws.plus(event.params.amount)
    totalInfos.save()
  }

  export function handleMint(event: MintEvent): void {
    let tradeVolume = TradeVolume.load(event.params.beneficiary.toHexString());
    if (!tradeVolume) {
      tradeVolume = new TradeVolume(event.params.beneficiary.toHexString())
      tradeVolume.account = event.params.beneficiary.toHexString()
      tradeVolume.size = BIG_NUM_ZERO
      tradeVolume.openLongs = BIG_NUM_ZERO
      tradeVolume.openShorts = BIG_NUM_ZERO
      tradeVolume.collateralUsage = BIG_NUM_ZERO
      tradeVolume.marginUsage = BIG_NUM_ZERO
      tradeVolume.vusdBalance = BIG_NUM_ZERO
    }
    tradeVolume.vusdBalance = tradeVolume.vusdBalance.plus(event.params.value)
    tradeVolume.save()
  }

  export function handleBurn(event: BurnEvent): void {
    let tradeVolume = TradeVolume.load(event.params.account.toHexString());
    if (!tradeVolume) {
      tradeVolume = new TradeVolume(event.params.account.toHexString())
      tradeVolume.account = event.params.account.toHexString()
      tradeVolume.size = BIG_NUM_ZERO
      tradeVolume.openLongs = BIG_NUM_ZERO
      tradeVolume.openShorts = BIG_NUM_ZERO
      tradeVolume.collateralUsage = BIG_NUM_ZERO
      tradeVolume.marginUsage = BIG_NUM_ZERO
      tradeVolume.vusdBalance = BIG_NUM_ZERO
    }
    tradeVolume.vusdBalance = tradeVolume.vusdBalance.minus(event.params.value)
    tradeVolume.save()
  }
  
  export function handleStake(event: StakeEvent): void {
    let vlpMint = new Mint(event.params.account.toHexString() + "-" + event.block.timestamp.toString())
    vlpMint.account = event.params.account.toHexString()
    vlpMint.timestamp = event.block.timestamp.toI32()
    vlpMint.token = event.params.token.toHexString()
    vlpMint.usdAmount = event.params.amount 
    vlpMint.vlpAmount = event.params.mintAmount
    vlpMint.save()
    if (HYPER_ONE_WALLETS.includes(event.params.account.toHexString())) {
      return;
    }
    let baseGlobalInfo = BaseGlobalInfo.load("global")
    if (!baseGlobalInfo) {
      baseGlobalInfo = new BaseGlobalInfo("global")
      baseGlobalInfo.accumulatedSUM = BIG_NUM_ZERO
      baseGlobalInfo.totalVLP = BIG_NUM_ZERO
      baseGlobalInfo.totalUSDC = BIG_NUM_ZERO
      baseGlobalInfo.totalStakes = BIG_NUM_ZERO
      baseGlobalInfo.totalUnstakes = BIG_NUM_ZERO
      baseGlobalInfo.hyper_ended = false
    }
    baseGlobalInfo.totalStakes = baseGlobalInfo.totalStakes.plus(event.params.amount)
    let baseUserInfo = BaseUserInfo.load(event.params.account.toHexString())
    if (!baseUserInfo) {
      baseUserInfo = new BaseUserInfo(event.params.account.toHexString())
      baseUserInfo.baseVela = BIG_NUM_ZERO
      baseUserInfo.baseRatio = BIG_NUM_ZERO
      baseUserInfo.baseVLP = BIG_NUM_ZERO
      baseUserInfo.minimumVLP = BIG_NUM_ZERO
      baseUserInfo.mintedVLP = BIG_NUM_ZERO
    }
    if (!baseGlobalInfo.hyper_ended && baseGlobalInfo.totalVLP.le(MAX_VLP_FOR_Hyper)) {
      let rewardAmount = BIG_NUM_ZERO
      let rewardTier = getRewardTier(BIG_NUM_ZERO, baseGlobalInfo.totalVLP)
      if (rewardTier == 0) {
        rewardTier = 1
      }
      let hyperStakingTier = HyperStakingTier.load(rewardTier.toString())
      if (!hyperStakingTier) {
        hyperStakingTier = new HyperStakingTier(rewardTier.toString())
        hyperStakingTier.tier = rewardTier
        if (rewardTier > 0) {
          hyperStakingTier.startVLP = getBaseVLP(rewardTier - 1)
          hyperStakingTier.endVLP = getBaseVLP(rewardTier)
        } else {
          hyperStakingTier.startVLP = BIG_NUM_ZERO
          hyperStakingTier.endVLP = BIG_NUM_ZERO
        }
        hyperStakingTier.velaReward = getRewardAmount2(rewardTier)
        hyperStakingTier.usdcCommitted = BIG_NUM_ZERO
        hyperStakingTier.vlpCommitted = BIG_NUM_ZERO
        hyperStakingTier.save()
      }
      let tempMintAmount = event.params.mintAmount
      let tempUSDCAmount = event.params.amount
      while((hyperStakingTier.vlpCommitted.plus(tempMintAmount)).gt(hyperStakingTier.endVLP.minus(hyperStakingTier.startVLP))) {
        let vlpCommitted = hyperStakingTier.endVLP.minus(hyperStakingTier.startVLP).minus(hyperStakingTier.vlpCommitted)
        let usdcCommitted = tempUSDCAmount.times(vlpCommitted).div(tempMintAmount)
        hyperStakingTier.vlpCommitted = hyperStakingTier.vlpCommitted.plus(vlpCommitted)
        hyperStakingTier.usdcCommitted = hyperStakingTier.usdcCommitted.plus(usdcCommitted)
        hyperStakingTier.save()
        let userStakingStats = new UserStakingStat(event.params.account.toHexString() + "-" + rewardTier.toString() + "-" + event.block.timestamp.toString())
        userStakingStats.account = event.params.account.toHexString()
        userStakingStats.tier = rewardTier;
        userStakingStats.usdcAmount = usdcCommitted;
        userStakingStats.vlpAmount = vlpCommitted;
        userStakingStats.timestamp = event.block.timestamp.toI32()
        userStakingStats.isHyper = true;
        userStakingStats.save()
        let userStakingTier = UserStakingTier.load(event.params.account.toHexString() + "-" + rewardTier.toString())
        if (!userStakingTier) {
          userStakingTier = new UserStakingTier(event.params.account.toHexString() + "-" + rewardTier.toString())
          userStakingTier.account = event.params.account.toHexString()
          userStakingTier.tier = rewardTier
          userStakingTier.usdcCommitted = BIG_NUM_ZERO
          userStakingTier.vlpCommitted = BIG_NUM_ZERO
        }
        userStakingTier.usdcCommitted = userStakingTier.usdcCommitted.plus(usdcCommitted)
        userStakingTier.vlpCommitted = userStakingTier.vlpCommitted.plus(vlpCommitted)
        userStakingTier.save()
        baseUserInfo.baseVLP = baseUserInfo.baseVLP.plus(vlpCommitted)
        rewardAmount = getRewardAmount2(rewardTier)
        baseGlobalInfo.accumulatedSUM = baseGlobalInfo.accumulatedSUM.minus(baseUserInfo.minimumVLP.times(baseUserInfo.baseRatio))
        baseUserInfo.baseVela = baseUserInfo.baseVela.plus(vlpCommitted.times(rewardAmount).div(BigInt.fromString('1000')))
        baseUserInfo.baseRatio = baseUserInfo.baseVela.times(BigInt.fromString('1000')).div(baseUserInfo.baseVLP)
        baseUserInfo.mintedVLP = baseUserInfo.mintedVLP.plus(vlpCommitted)
        baseUserInfo.minimumVLP = baseUserInfo.minimumVLP.plus(vlpCommitted)
        baseGlobalInfo.accumulatedSUM = baseGlobalInfo.accumulatedSUM.plus(baseUserInfo.minimumVLP.times(baseUserInfo.baseRatio))
        tempMintAmount = tempMintAmount.minus(vlpCommitted)
        tempUSDCAmount = tempUSDCAmount.minus(usdcCommitted)
        rewardTier = rewardTier + 1
        if (rewardTier > 5 || tempMintAmount.equals(BigInt.fromString('0'))) {
          break;
        }
        hyperStakingTier = new HyperStakingTier(rewardTier.toString())
        hyperStakingTier.tier = rewardTier
        hyperStakingTier.startVLP = getBaseVLP(rewardTier - 1)
        hyperStakingTier.endVLP = getBaseVLP(rewardTier)
        hyperStakingTier.velaReward = getRewardAmount2(rewardTier)
        hyperStakingTier.vlpCommitted = BIG_NUM_ZERO
        hyperStakingTier.usdcCommitted = BIG_NUM_ZERO
        hyperStakingTier.save()
        if ((hyperStakingTier.vlpCommitted.plus(tempMintAmount)).le(hyperStakingTier.endVLP.minus(hyperStakingTier.startVLP))) {
          break;
        }
      }
      if (rewardTier < 6 && tempMintAmount.gt(BigInt.fromString('0'))) {
        hyperStakingTier.vlpCommitted = hyperStakingTier.vlpCommitted.plus(tempMintAmount)
        hyperStakingTier.usdcCommitted = hyperStakingTier.usdcCommitted.plus(tempUSDCAmount)
        hyperStakingTier.save()
        let userStakingStats = new UserStakingStat(event.params.account.toHexString() + "-" + rewardTier.toString() + "-" + event.block.timestamp.toString())
        userStakingStats.account = event.params.account.toHexString()
        userStakingStats.tier = rewardTier;
        userStakingStats.usdcAmount = tempUSDCAmount;
        userStakingStats.vlpAmount = tempMintAmount;
        userStakingStats.timestamp = event.block.timestamp.toI32()
        userStakingStats.isHyper = true;
        userStakingStats.save()
        let userStakingTier = UserStakingTier.load(event.params.account.toHexString() + "-" + rewardTier.toString())
        if (!userStakingTier) {
          userStakingTier = new UserStakingTier(event.params.account.toHexString() + "-" + rewardTier.toString())
          userStakingTier.account = event.params.account.toHexString()
          userStakingTier.tier = rewardTier
          userStakingTier.usdcCommitted = BIG_NUM_ZERO
          userStakingTier.vlpCommitted = BIG_NUM_ZERO
        }
        userStakingTier.usdcCommitted = userStakingTier.usdcCommitted.plus(tempUSDCAmount)
        userStakingTier.vlpCommitted = userStakingTier.vlpCommitted.plus(tempMintAmount)
        userStakingTier.save()
        baseUserInfo.baseVLP = baseUserInfo.baseVLP.plus(tempMintAmount)
        rewardAmount = getRewardAmount2(rewardTier)
        baseGlobalInfo.accumulatedSUM = baseGlobalInfo.accumulatedSUM.minus(baseUserInfo.minimumVLP.times(baseUserInfo.baseRatio))
        baseUserInfo.baseVela = baseUserInfo.baseVela.plus(tempMintAmount.times(rewardAmount).div(BigInt.fromString('1000')))
        baseUserInfo.baseRatio = baseUserInfo.baseVela.times(BigInt.fromString('1000')).div(baseUserInfo.baseVLP)
        baseUserInfo.mintedVLP = baseUserInfo.mintedVLP.plus(tempMintAmount)
        baseUserInfo.minimumVLP = baseUserInfo.minimumVLP.plus(tempMintAmount)
        baseGlobalInfo.accumulatedSUM = baseGlobalInfo.accumulatedSUM.plus(baseUserInfo.minimumVLP.times(baseUserInfo.baseRatio))
      }
      baseGlobalInfo.totalVLP = baseGlobalInfo.totalVLP.plus(event.params.mintAmount)
      baseGlobalInfo.totalUSDC = baseGlobalInfo.totalUSDC.plus(event.params.amount)
      if (baseGlobalInfo.totalVLP.ge(MAX_VLP_FOR_Hyper)) {
        baseGlobalInfo.hyper_ended = true
      } 
      // else if (event.block.timestamp.toI32() >= HYPER_END_TIME) {
      //   baseGlobalInfo.hyper_ended = true
      // }
    } else {
      baseGlobalInfo.totalVLP = baseGlobalInfo.totalVLP.plus(event.params.mintAmount)
      baseGlobalInfo.totalUSDC = baseGlobalInfo.totalUSDC.plus(event.params.amount)
      baseUserInfo.mintedVLP = baseUserInfo.mintedVLP.plus(event.params.mintAmount)
    }
    baseGlobalInfo.save()
    baseUserInfo.save()
  }

  export function handleUnstake(event: UnstakeEvent): void {
    let vlpRedeem = new Redeem(event.params.account.toHexString() + "-" + event.block.timestamp.toString())
    vlpRedeem.account = event.params.account.toHexString()
    vlpRedeem.timestamp = event.block.timestamp.toI32()
    vlpRedeem.token = event.params.token.toHexString()
    vlpRedeem.usdAmount = event.params.amountOut 
    vlpRedeem.vlpAmount = event.params.vlpAmount
    vlpRedeem.save()
    if (HYPER_ONE_WALLETS.includes(event.params.account.toHexString())) {
      return;
    }
    let baseGlobalInfo = BaseGlobalInfo.load("global")
    if (!baseGlobalInfo) {
      baseGlobalInfo = new BaseGlobalInfo("global")
      baseGlobalInfo.accumulatedSUM = BIG_NUM_ZERO
      baseGlobalInfo.totalVLP = BIG_NUM_ZERO
      baseGlobalInfo.totalUSDC = BIG_NUM_ZERO
      baseGlobalInfo.totalStakes = BIG_NUM_ZERO
      baseGlobalInfo.totalUnstakes = BIG_NUM_ZERO
      baseGlobalInfo.hyper_ended = false
    }
    baseGlobalInfo.totalUnstakes = baseGlobalInfo.totalUnstakes.plus(event.params.amountOut)
    let baseUserInfo = BaseUserInfo.load(event.params.account.toHexString())
    if (!baseUserInfo) {
      baseUserInfo = new BaseUserInfo(event.params.account.toHexString())
      baseUserInfo.baseVela = BIG_NUM_ZERO
      baseUserInfo.baseRatio = BIG_NUM_ZERO
      baseUserInfo.baseVLP = BIG_NUM_ZERO
      baseUserInfo.minimumVLP = BIG_NUM_ZERO
      baseUserInfo.mintedVLP = BIG_NUM_ZERO
    }
    if (baseGlobalInfo.hyper_ended) {
      baseGlobalInfo.totalVLP = baseGlobalInfo.totalVLP.minus(event.params.vlpAmount)
      baseGlobalInfo.totalUSDC = baseGlobalInfo.totalUSDC.minus(event.params.amountOut)
      baseGlobalInfo.accumulatedSUM = baseGlobalInfo.accumulatedSUM.minus(baseUserInfo.minimumVLP.times(baseUserInfo.baseRatio))
      baseUserInfo.mintedVLP = baseUserInfo.mintedVLP.minus(event.params.vlpAmount)
      if (baseUserInfo.mintedVLP.lt(baseUserInfo.minimumVLP)) {
        baseUserInfo.minimumVLP = baseUserInfo.mintedVLP
      }
      baseGlobalInfo.accumulatedSUM = baseGlobalInfo.accumulatedSUM.plus(baseUserInfo.minimumVLP.times(baseUserInfo.baseRatio))
    } else {
      baseGlobalInfo.totalVLP = baseGlobalInfo.totalVLP.minus(event.params.vlpAmount)
      baseGlobalInfo.totalUSDC = baseGlobalInfo.totalUSDC.minus(event.params.amountOut)
    }
    baseGlobalInfo.save()
    baseUserInfo.save()
  }

  export function handleLiquidatePosition(event: LiquidatePositionEvent): void {
    let liquidatePositionEntity = new LiquidatePosition(event.params.posId.toString() + "-" + event.block.timestamp.toString())
    let positionStatsEntity = PositionStat.load(event.params.posId.toString())
    let realisedPnl = BIG_NUM_ZERO
    if (positionStatsEntity) {
      let tradeVolumeEntity = TradeVolume.load(positionStatsEntity.account);
      if (!tradeVolumeEntity) {
        tradeVolumeEntity = new TradeVolume(positionStatsEntity.account)
        tradeVolumeEntity.account = positionStatsEntity.account
        tradeVolumeEntity.size = BIG_NUM_ZERO
        tradeVolumeEntity.openLongs = BIG_NUM_ZERO
        tradeVolumeEntity.openShorts = BIG_NUM_ZERO
        tradeVolumeEntity.collateralUsage = BIG_NUM_ZERO
        tradeVolumeEntity.marginUsage = BIG_NUM_ZERO
        tradeVolumeEntity.vusdBalance = BIG_NUM_ZERO
      }
      if (positionStatsEntity.isLong) {
        tradeVolumeEntity.openLongs = tradeVolumeEntity.openLongs.minus(positionStatsEntity.size)
      } else {
        tradeVolumeEntity.openShorts = tradeVolumeEntity.openShorts.minus(positionStatsEntity.size)
      }
      tradeVolumeEntity.collateralUsage = tradeVolumeEntity.collateralUsage.minus(positionStatsEntity.collateral)
      tradeVolumeEntity.marginUsage =  tradeVolumeEntity.marginUsage.plus(event.params.posData[4])
      tradeVolumeEntity.size = tradeVolumeEntity.size.plus(positionStatsEntity.size)
      tradeVolumeEntity.save()
      liquidatePositionEntity.account = positionStatsEntity.account
      liquidatePositionEntity.tokenId = positionStatsEntity.tokenId
      liquidatePositionEntity.isLong = positionStatsEntity.isLong
      liquidatePositionEntity.posId = positionStatsEntity.posId
      if (event.params.pnlData[0].times(BigInt.fromString("-1")).gt(positionStatsEntity.collateral)) {
        realisedPnl = BigInt.fromString("-1").times(positionStatsEntity.collateral)
      } else {
        realisedPnl = event.params.pnlData[0]
      }
      let newROI = BIG_NUM_ZERO
      if (positionStatsEntity.maxCollateral.gt(BIG_NUM_ZERO)) {
        newROI = BigInt.fromString('100000').times(realisedPnl).div(positionStatsEntity.maxCollateral)
      }
      processUserTradeStats(
        event.params.posId,
        event.block.timestamp,
        positionStatsEntity.account,
        "LIQUIDATE_POSITION",
        BIG_NUM_ZERO,
        positionStatsEntity.averagePrice,
        positionStatsEntity.collateral,
        event.params.posData[4],
        event.params.pnlData[1],
        event.params.pnlData[2],
        positionStatsEntity.isLong,
        true,
        false,
        event.params.posData[3],
        positionStatsEntity.positionType,
        realisedPnl,
        newROI,
        positionStatsEntity.size,
        positionStatsEntity.tokenId,
        event.transaction.hash.toHexString()
      )
      let dailyTradesId = getAccountDailyTradesId(positionStatsEntity.account, event.block.timestamp)
      let hourlyVolumeId = getAccountHourlyTradesId(positionStatsEntity.tokenId.toString(), event.block.timestamp)
      let hourlyTradesId = getAccountHourlyTradesId(positionStatsEntity.account, event.block.timestamp)
      let monthlyTradesId = getAccountMonthlyTradesId(positionStatsEntity.account, event.block.timestamp)
      let weeklyTradesId = getAccountWeeklyTradesId(positionStatsEntity.account, event.block.timestamp)
      processHourlyTrades(
        hourlyTradesId,
        positionStatsEntity.account, 
        positionStatsEntity.collateral, 
        BIG_NUM_ZERO,
        false,
        true,
        realisedPnl,
        positionStatsEntity.size,
        event.block.timestamp
      )
      processDailyTrades(
        dailyTradesId,
        positionStatsEntity.account, 
        positionStatsEntity.collateral, 
        BIG_NUM_ZERO,
        false,
        true,
        realisedPnl,
        positionStatsEntity.size,
        event.block.timestamp
      )
      let hourlyVolume = HourlyVolume.load(hourlyVolumeId)
      if (!hourlyVolume) {
        hourlyVolume = new HourlyVolume(hourlyVolumeId)
        hourlyVolume.amount = BIG_NUM_ZERO
        hourlyVolume.tokenId = positionStatsEntity.tokenId
        hourlyVolume.timestamp = getHourStartDate(event.block.timestamp)
        hourlyVolume.tradeCounts = 0
      }
      hourlyVolume.amount = hourlyVolume.amount.plus(positionStatsEntity.size)
      hourlyVolume.tradeCounts += 1
      hourlyVolume.save()
      process24HVolume(positionStatsEntity.tokenId.toString(), event.block.timestamp.toI32())
      processMonthlyTrades(
        monthlyTradesId,
        positionStatsEntity.account, 
        positionStatsEntity.collateral, 
        BIG_NUM_ZERO,
        false,
        true,
        realisedPnl,
        positionStatsEntity.size,
        event.block.timestamp
      )
      processWeeklyTrades(
        weeklyTradesId,
        positionStatsEntity.account, 
        positionStatsEntity.collateral, 
        BIG_NUM_ZERO,
        false,
        true,
        realisedPnl,
        positionStatsEntity.size,
        event.block.timestamp
      )
      processAllTrades(
        positionStatsEntity.account, 
        positionStatsEntity.collateral, 
        BIG_NUM_ZERO,
        false,
        true,
        realisedPnl,
        positionStatsEntity.size
      )
      let dailyGlobalInfoId = getAccountDailyTradesId("global", event.block.timestamp)
      let dailyGlobalInfo = DailyGlobalInfo.load(dailyGlobalInfoId)
      if (!dailyGlobalInfo) {
        dailyGlobalInfo = new DailyGlobalInfo(dailyGlobalInfoId)
        dailyGlobalInfo.fees = BIG_NUM_ZERO
        dailyGlobalInfo.timestamp = getHourStartDate(event.block.timestamp)      
        dailyGlobalInfo.openInterests = BIG_NUM_ZERO
        dailyGlobalInfo.tradeVolume = BIG_NUM_ZERO
        dailyGlobalInfo.tradeCounts = 0
        dailyGlobalInfo.save()
      }
      dailyGlobalInfo.openInterests = dailyGlobalInfo.openInterests.minus(positionStatsEntity.size)
      dailyGlobalInfo.tradeVolume = dailyGlobalInfo.tradeVolume.plus(positionStatsEntity.size)
      dailyGlobalInfo.tradeCounts += 1
      dailyGlobalInfo.save()

      positionStatsEntity.closedAt = event.block.timestamp.toI32()
      positionStatsEntity.lastUpdateTime = event.block.timestamp.toI32()
      positionStatsEntity.markPrice = event.params.posData[3]
      positionStatsEntity.realisedPnl = positionStatsEntity.realisedPnl.plus(realisedPnl)
      positionStatsEntity.totalROI = positionStatsEntity.totalROI.plus(newROI)
      positionStatsEntity.positionStatus = "LIQUIDATED"
      positionStatsEntity.save()
      let positionTriggerEntity = PositionTrigger.load(event.params.posId.toString())
      if (positionTriggerEntity) {
        positionTriggerEntity.status = "CLOSED";
        positionTriggerEntity.save()
      }
      processGlobalInfo(
        positionStatsEntity.tokenId, 
        positionStatsEntity.isLong, 
        false,
        false,
        BIG_NUM_ZERO,
        BIG_NUM_ZERO,
        positionStatsEntity.size)
      let strandedUsdc = StrandedUSDCAmount.load("total")
      if (!strandedUsdc) { 
        strandedUsdc = new StrandedUSDCAmount("total")
        strandedUsdc.amount = BIG_NUM_ZERO
        strandedUsdc.fees = BIG_NUM_ZERO
      }
      strandedUsdc.amount = strandedUsdc.amount.plus(positionStatsEntity.collateral)
      strandedUsdc.fees = strandedUsdc.fees.plus(event.params.posData[4])
      strandedUsdc.save()
    } else {
      liquidatePositionEntity.account = '0x0000000000000000000000000000000000000420'
      liquidatePositionEntity.tokenId = BIG_NUM_ZERO
      liquidatePositionEntity.isLong = false
      liquidatePositionEntity.posId = BIG_NUM_ZERO
    }
    liquidatePositionEntity.feeUsd = BIG_NUM_ZERO
    liquidatePositionEntity.markPrice = event.params.posData[3]
    liquidatePositionEntity.realisedPnl = event.params.pnlData[0]
    liquidatePositionEntity.timestamp = event.block.timestamp.toI32()
    liquidatePositionEntity.from = event.transaction.from.toHexString()
    liquidatePositionEntity.transactionHash = event.transaction.hash.toHexString()
    liquidatePositionEntity.save()
  }
  
  export function handlePlatformFeeTransfer(event: PlatformFeeTransferEvent): void {
    let platformFee = new PlatformFee(event.params.account.toHexString() + "-" + event.block.timestamp.toString())
    platformFee.amount = event.params.amount
    platformFee.account = event.params.account.toHexString()
    platformFee.trader = event.params.trader.toHexString()
    platformFee.createdAt = event.block.timestamp.toI32()
    platformFee.trasactionHash = event.transaction.hash.toHexString()
    platformFee.save()
  }

  export function handleReferFeeTransfer(event: ReferFeeTransferEvent): void {
    let referFee = new ReferFee(event.params.account.toHexString() + "-" + event.block.timestamp.toString())
    referFee.amount = event.params.amount
    referFee.account = event.params.account.toHexString()
    referFee.trader = ZERO_ADDRESS
    referFee.rebate = BIG_NUM_ZERO
    referFee.createdAt = event.block.timestamp.toI32()
    referFee.trasactionHash = event.transaction.hash.toHexString()
    referFee.save()
  }

  export function handleReferFeeTraderRebate(event: ReferFeeTraderRebateEvent): void {
    let referFee = new ReferFee(event.params.account.toHexString() + "-" + event.block.timestamp.toString())
    referFee.amount = event.params.amount
    referFee.account = event.params.account.toHexString()
    referFee.trader = event.params.trader.toHexString()
    referFee.rebate = event.params.rebate
    referFee.createdAt = event.block.timestamp.toI32()
    referFee.trasactionHash = event.transaction.hash.toHexString()
    referFee.save()
  }

  export function handleRegisterLiquidation(event: RegisterLiquidation): void {

  }

  export function handleAddTrailingStop(event: AddTrailingStop): void {
      
  }

  export function handleAddTriggerOrders(event: AddTriggerOrders): void {
    let positionTriggerEntity = PositionTrigger.load(event.params.posId.toString())
    if (!positionTriggerEntity) {
      let positionStatsEntity = PositionStat.load(event.params.posId.toString())
      if (positionStatsEntity) {
        positionTriggerEntity = new PositionTrigger(event.params.posId.toString())
        positionTriggerEntity.account = positionStatsEntity.account
        positionTriggerEntity.tokenId = positionStatsEntity.tokenId
        positionTriggerEntity.isLong = positionStatsEntity.isLong
        positionTriggerEntity.posId = positionStatsEntity.posId
        positionTriggerEntity.status = "OPEN"
        positionTriggerEntity.save()
      }
    }
    if (positionTriggerEntity) {
      let trigger = new Trigger(event.params.posId.toString() + "-" + event.params.orderId.toString())
      trigger.amountPercent = event.params.amountPercent
      trigger.createdAt = event.block.timestamp.toI32()
      trigger.triggerId = event.params.orderId.toI32()
      trigger.isTP = event.params.isTP
      trigger.order = positionTriggerEntity.id
      trigger.price = event.params.price
      trigger.status = "OPEN"
      trigger.triggeredAmount = BIG_NUM_ZERO
      trigger.triggeredAt = 0
      trigger.save()
      positionTriggerEntity.save()
    }
  }

  export function handleExecuteTriggerOrders(event: ExecuteTriggerOrders): void {
    let positionTriggerEntity = PositionTrigger.load(event.params.posId.toString())
    if (!positionTriggerEntity) {
      let positionStatsEntity = PositionStat.load(event.params.posId.toString())
      if (positionStatsEntity) {
        positionTriggerEntity = new PositionTrigger(event.params.posId.toString())
        positionTriggerEntity.account = positionStatsEntity.account
        positionTriggerEntity.tokenId = positionStatsEntity.tokenId
        positionTriggerEntity.isLong = positionStatsEntity.isLong
        positionTriggerEntity.posId = positionStatsEntity.posId
        positionTriggerEntity.status = "OPEN"
        positionTriggerEntity.save()
      }
    }
    if (positionTriggerEntity) {
      let trigger = Trigger.load(event.params.posId.toString() + "-" + event.params.orderId.toString())
      if (trigger) {
        trigger.triggeredAt = event.block.timestamp.toI32()
        trigger.triggeredAmount = event.params.amount
        trigger.status = "TRIGGERED"
        trigger.save()
      }
    }      
  }

  export function handleEditTriggerOrder(event: EditTriggerOrder): void {
    let trigger = Trigger.load(event.params.posId.toString() + "-" + event.params.orderId.toString())
    if (trigger) {
      trigger.isTP = event.params.isTP
      trigger.price = event.params.price
      trigger.amountPercent = event.params.amountPercent
      trigger.save()
    }
  }

  export function handleNewOrder(event: NewOrder): void {
    let positionStatsEntity = PositionStat.load(event.params.posId.toString())
    if (!positionStatsEntity) {
        positionStatsEntity = new PositionStat(event.params.posId.toString())
        positionStatsEntity.account = event.params.account.toHexString()
        positionStatsEntity.averagePrice = BIG_NUM_ZERO
        positionStatsEntity.collateral = BIG_NUM_ZERO
        positionStatsEntity.totalCollateral = BIG_NUM_ZERO
        positionStatsEntity.totalSize = BIG_NUM_ZERO
        positionStatsEntity.totalClosedSize = BIG_NUM_ZERO
        positionStatsEntity.totalIncreasedCollateral = BIG_NUM_ZERO
        positionStatsEntity.maxCollateral = BIG_NUM_ZERO
        positionStatsEntity.totalROI = BIG_NUM_ZERO
        positionStatsEntity.closedAt = 0
        positionStatsEntity.closeHash = ""
        positionStatsEntity.createdAt = event.block.timestamp.toI32()
        positionStatsEntity.createHash = event.transaction.hash.toHexString()
        positionStatsEntity.positionFee = BIG_NUM_ZERO
        positionStatsEntity.fundingFee = BIG_NUM_ZERO
        positionStatsEntity.borrowFee = BIG_NUM_ZERO
        positionStatsEntity.lastUpdateTime = 0
        positionStatsEntity.tokenId = event.params.tokenId
        positionStatsEntity.isLong = event.params.isLong
        positionStatsEntity.markPrice = BIG_NUM_ZERO
        if (event.params.positionType.toI32() == 0) {
            positionStatsEntity.lmtPrice = BIG_NUM_ZERO
            positionStatsEntity.pendingCollateral = BIG_NUM_ZERO
            positionStatsEntity.pendingSize = BIG_NUM_ZERO
            positionStatsEntity.positionType = "Market Order"
        } else if (event.params.positionType.toI32() == 1) {
            positionStatsEntity.lmtPrice = event.params.triggerData[0]
            positionStatsEntity.pendingCollateral = event.params.triggerData[2]
            positionStatsEntity.pendingSize = event.params.triggerData[3]
            positionStatsEntity.positionType = "Limit Order"
        } else if (event.params.positionType.toI32() == 2) {
            positionStatsEntity.lmtPrice = event.params.triggerData[0]
            positionStatsEntity.pendingCollateral = event.params.triggerData[2]
            positionStatsEntity.pendingSize = event.params.triggerData[3]
            positionStatsEntity.positionType = "Stop Market"
        } else if (event.params.positionType.toI32() == 3) {
            positionStatsEntity.lmtPrice = event.params.triggerData[0]
            positionStatsEntity.pendingCollateral = event.params.triggerData[2]
            positionStatsEntity.pendingSize = event.params.triggerData[3]
            positionStatsEntity.positionType = "Stop Limit"
        } else {
            positionStatsEntity.lmtPrice = event.params.triggerData[0]
            positionStatsEntity.pendingCollateral = event.params.triggerData[2]
            positionStatsEntity.pendingSize = event.params.triggerData[3]
            positionStatsEntity.positionType = "Trailing Stop"
        }
        if (event.params.orderStatus == 0) {
            positionStatsEntity.orderStatus = "NONE";
        } else if (event.params.orderStatus == 1) {
            positionStatsEntity.orderStatus = "PENDING";
        } else if (event.params.orderStatus == 2) {
            positionStatsEntity.orderStatus = "FILLED";
        } else {
            positionStatsEntity.orderStatus = "CANCELED";
        }
        positionStatsEntity.pendingDelayCollateral = BIG_NUM_ZERO
        positionStatsEntity.pendingDelaySize = BIG_NUM_ZERO
        positionStatsEntity.positionStatus = "OPEN"
        positionStatsEntity.posId = event.params.posId
        positionStatsEntity.realisedPnl = BIG_NUM_ZERO
        positionStatsEntity.size = BIG_NUM_ZERO
        positionStatsEntity.stpPrice = event.params.triggerData[1]
        positionStatsEntity.save()
    }
  }

  export function handleFinishOrder(event: FinishOrderEvent): void {
    let positionStatsEntity = PositionStat.load(event.params.posId.toString())
    if (positionStatsEntity) {
      if (event.params.positionType.toI32() == 0) {
          positionStatsEntity.positionType = "Market Order"
      } else if (event.params.positionType.toI32() == 1) {
          positionStatsEntity.positionType = "Limit Order"
      } else if (event.params.positionType.toI32() == 2) {
          positionStatsEntity.positionType = "Stop Market"
      } else if (event.params.positionType.toI32() == 3) {
          positionStatsEntity.positionType = "Stop Limit"
      } else {
          positionStatsEntity.positionType = "Trailing Stop"
      }
      if (event.params.orderStatus == 0) {
          positionStatsEntity.orderStatus = "NONE";
      } else if (event.params.orderStatus == 1) {
          positionStatsEntity.orderStatus = "PENDING";
      } else if (event.params.orderStatus == 2) {
          positionStatsEntity.orderStatus = "FILLED";
      } else {
          positionStatsEntity.orderStatus = "CANCELED";
          positionStatsEntity.positionStatus = "CANCELED"
          positionStatsEntity.closeHash = event.transaction.hash.toHexString()
      }
      positionStatsEntity.save()
    }      
  }

  export function handleUpdateOrder(event: UpdateOrderEvent): void {
    let positionStatsEntity = PositionStat.load(event.params.posId.toString())
    if (positionStatsEntity) {
        if (event.params.positionType.toI32() == 0) {
            positionStatsEntity.positionType = "Market Order"
        } else if (event.params.positionType.toI32() == 1) {
            positionStatsEntity.positionType = "Limit Order"
        } else if (event.params.positionType.toI32() == 2) {
            positionStatsEntity.positionType = "Stop Market"
        } else if (event.params.positionType.toI32() == 3) {
            positionStatsEntity.positionType = "Stop Limit"
        } else {
            positionStatsEntity.positionType = "Trailing Stop"
        }
        if (event.params.orderStatus == 0) {
            positionStatsEntity.orderStatus = "NONE";
        } else if (event.params.orderStatus == 1) {
            positionStatsEntity.orderStatus = "PENDING";
        } else if (event.params.orderStatus == 2) {
            positionStatsEntity.orderStatus = "FILLED";
        } else {
            positionStatsEntity.orderStatus = "CANCELED";
            positionStatsEntity.positionStatus = "CANCELED"
            positionStatsEntity.closeHash = event.transaction.hash.toHexString()
        }
        positionStatsEntity.save()
    }      
  }

  export function handleUpdateFunding(event: UpdateFunding): void {
      let tokenConfig = TokenConfig.load(event.params.tokenId.toString())
      if (!tokenConfig) {
        tokenConfig = new TokenConfig(event.params.tokenId.toString())
        tokenConfig.tokenId = event.params.tokenId
        tokenConfig.fundingIndex = event.params.fundingIndex
        tokenConfig.lastFundingTime = event.block.timestamp.toI32()
      }
      tokenConfig.fundingIndex = event.params.fundingIndex
      tokenConfig.lastFundingTime = event.block.timestamp.toI32()
      tokenConfig.save()
  }

  export function handleDecreaseOpenInterest(event: DecreaseOpenInterest): void {
    let allOpenInterest = OpenInterest.load("all")
    if (!allOpenInterest) {
      allOpenInterest = new OpenInterest("all")
      allOpenInterest.tokenId = "all"
      allOpenInterest.amount = BIG_NUM_ZERO
    }
    allOpenInterest.amount = allOpenInterest.amount.minus(event.params.amount)
    allOpenInterest.save()

    let tokenOpenInterest = OpenInterest.load(event.params.id.toString())
    if (!tokenOpenInterest) {
      tokenOpenInterest = new OpenInterest(event.params.id.toString())
      tokenOpenInterest.tokenId = event.params.id.toString()
      tokenOpenInterest.amount = BIG_NUM_ZERO
    }
    tokenOpenInterest.amount = tokenOpenInterest.amount.minus(event.params.amount)
    tokenOpenInterest.save()      
  }

  export function handleIncreaseOpenInterest(event: IncreaseOpenInterest): void {
    let allOpenInterest = OpenInterest.load("all")
    if (!allOpenInterest) {
      allOpenInterest = new OpenInterest("all")
      allOpenInterest.tokenId = "all"
      allOpenInterest.amount = BIG_NUM_ZERO
    }
    allOpenInterest.amount = allOpenInterest.amount.plus(event.params.amount)
    allOpenInterest.save()

    let tokenOpenInterest = OpenInterest.load(event.params.id.toString())
    if (!tokenOpenInterest) {
      tokenOpenInterest = new OpenInterest(event.params.id.toString())
      tokenOpenInterest.tokenId = event.params.id.toString()
      tokenOpenInterest.amount = BIG_NUM_ZERO
    }
    tokenOpenInterest.amount = tokenOpenInterest.amount.plus(event.params.amount)
    tokenOpenInterest.save()
  }

  export function handleUpdateTrailingStop(event: UpdateTrailingStop): void {
      
  }

  export function handleUpdateTriggerOrderStatus(event: UpdateTriggerOrderStatus): void {
    let positionTriggerEntity = PositionTrigger.load(event.params.posId.toString())
    if (positionTriggerEntity) {
      let trigger = Trigger.load(event.params.posId.toString() + "-" + event.params.orderId.toString())
      if (trigger) {
        if (event.params.status == 3) {}
        trigger.status = "CANCELED"
        trigger.save()
      }
    } 
  }

