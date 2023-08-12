import {
    ClosePosition as ClosePositionEvent,
    DecreasePosition as DecreasePositionEvent,
    IncreasePosition as IncreasePositionEvent,
    CreateAddPositionOrder,
    AddOrRemoveCollateral,
    AddPositionExecutionError,
    CreateDecreasePositionOrder,
    DecreasePositionExecutionError,
    ExecuteAddPositionOrder,
    ExecuteDecreasePositionOrder,
    MarketOrderExecutionError
  } from "../generated/PositionVault/PositionVault"

import {
    DailyTrade,
    AllTrade,
    ClosePosition,
    DecreasePosition,
    DailyGlobalInfo,
    IncreasePosition,
    MonthlyTrade,
    WeeklyTrade,
    PositionStat,
    PositionTrigger,
    TradeVolume,
    HourlyTrade,
    HourlyVolume,
  } from "../generated/schema"
import { process24HVolume, processAllTrades, processDailyTrades, processGlobalInfo, processHourlyTrades, processMonthlyTrades, processUserTradeStats, processWeeklyTrades  } from "./process"
import { BigInt } from "@graphprotocol/graph-ts"
import { 
    BIG_NUM_ZERO,
    getAccountDailyTradesId,
    getAccountHourlyTradesId,
    getAccountMonthlyTradesId,
    getAccountWeeklyTradesId,
    getDayStartDate,
    getHourStartDate,
    getMonthStartDate,
    getWeekStartDate
 } from "./constants"


  export function handleAddOrRemoveCollateral(event: AddOrRemoveCollateral): void {
  let positionStatsEntity = PositionStat.load(event.params.posId.toString())
  if (positionStatsEntity) {
    processUserTradeStats(
      event.params.posId,
      event.block.timestamp,
      positionStatsEntity.account,
      "EDIT_COLLATERAL",
      event.params.amount,
      positionStatsEntity.averagePrice,
      event.params.collateral,
      BIG_NUM_ZERO,
      BIG_NUM_ZERO,
      BIG_NUM_ZERO,
      positionStatsEntity.isLong,
      event.params.isPlus,
      true,
      positionStatsEntity.markPrice,
      positionStatsEntity.positionType,
      BIG_NUM_ZERO,
      BIG_NUM_ZERO,
      event.params.size,
      positionStatsEntity.tokenId,
      event.transaction.hash.toHexString()
    )
    let dailyTradesId = getAccountDailyTradesId(positionStatsEntity.account, event.block.timestamp)
    let hourlyTradesId = getAccountHourlyTradesId(positionStatsEntity.account, event.block.timestamp)
    let monthlyTradesId = getAccountMonthlyTradesId(positionStatsEntity.account, event.block.timestamp)
    let weeklyTradesId = getAccountWeeklyTradesId(positionStatsEntity.account, event.block.timestamp)
    let hourlyTrades = HourlyTrade.load(hourlyTradesId)
    if (!hourlyTrades) {
        hourlyTrades = new HourlyTrade(hourlyTradesId)
        hourlyTrades.account = positionStatsEntity.account
        hourlyTrades.collateral = BIG_NUM_ZERO
        hourlyTrades.fees = BIG_NUM_ZERO
        hourlyTrades.timestamp = getHourStartDate(event.block.timestamp);
        hourlyTrades.tradeVolume = BIG_NUM_ZERO
        hourlyTrades.profitLoss = BIG_NUM_ZERO
        hourlyTrades.tradeCount = 0
        hourlyTrades.winCount = 0 
        hourlyTrades.lossCount = 0
        hourlyTrades.leverage = BIG_NUM_ZERO
    }
    if (event.params.isPlus) {
        hourlyTrades.collateral = hourlyTrades.collateral.plus(event.params.amount)
    } else {
        hourlyTrades.collateral = hourlyTrades.collateral.minus(event.params.amount)
    }
    if (hourlyTrades.collateral.equals(BIG_NUM_ZERO)) {
        hourlyTrades.leverage = BIG_NUM_ZERO
    } else {
        hourlyTrades.leverage = hourlyTrades.tradeVolume.times(BigInt.fromString("1000")).div(hourlyTrades.collateral)
    }
    hourlyTrades.save()
    let dailyTrades = DailyTrade.load(dailyTradesId)
    if (!dailyTrades) {
        dailyTrades = new DailyTrade(dailyTradesId)
        dailyTrades.account = positionStatsEntity.account
        dailyTrades.collateral = BIG_NUM_ZERO
        dailyTrades.fees = BIG_NUM_ZERO
        dailyTrades.timestamp = getDayStartDate(event.block.timestamp);
        dailyTrades.tradeVolume = BIG_NUM_ZERO
        dailyTrades.profitLoss = BIG_NUM_ZERO
        dailyTrades.tradeCount = 0
        dailyTrades.winCount = 0 
        dailyTrades.lossCount = 0
        dailyTrades.leverage = BIG_NUM_ZERO
    }
    if (event.params.isPlus) {
        dailyTrades.collateral = dailyTrades.collateral.plus(event.params.amount)
    } else {
        dailyTrades.collateral = dailyTrades.collateral.minus(event.params.amount)
    }
    if (dailyTrades.collateral.equals(BIG_NUM_ZERO)) {
        dailyTrades.leverage = BIG_NUM_ZERO
    } else {
        dailyTrades.leverage = dailyTrades.tradeVolume.times(BigInt.fromString("1000")).div(dailyTrades.collateral)
    }
    dailyTrades.save()
    let monthlyTrades = MonthlyTrade.load(monthlyTradesId)
    if (!monthlyTrades) {
        monthlyTrades = new MonthlyTrade(monthlyTradesId)
        monthlyTrades.account = positionStatsEntity.account
        monthlyTrades.collateral = BIG_NUM_ZERO
        monthlyTrades.fees = BIG_NUM_ZERO
        monthlyTrades.timestamp = getMonthStartDate(event.block.timestamp);
        monthlyTrades.tradeVolume = BIG_NUM_ZERO
        monthlyTrades.profitLoss = BIG_NUM_ZERO
        monthlyTrades.tradeCount = 0
        monthlyTrades.winCount = 0 
        monthlyTrades.lossCount = 0
        monthlyTrades.leverage = BIG_NUM_ZERO
    }
    if (event.params.isPlus) {
        monthlyTrades.collateral = monthlyTrades.collateral.plus(event.params.amount)
    } else {
        monthlyTrades.collateral = monthlyTrades.collateral.minus(event.params.amount)
    }
    if (monthlyTrades.collateral.equals(BIG_NUM_ZERO)) {
        monthlyTrades.leverage = BIG_NUM_ZERO
    } else {
        monthlyTrades.leverage = monthlyTrades.tradeVolume.times(BigInt.fromString("1000")).div(monthlyTrades.collateral)
    }
    monthlyTrades.save()
    let weeklyTrades = WeeklyTrade.load(weeklyTradesId)
    if (!weeklyTrades) {
        weeklyTrades = new WeeklyTrade(weeklyTradesId)
        weeklyTrades.account = positionStatsEntity.account
        weeklyTrades.collateral = BIG_NUM_ZERO
        weeklyTrades.fees = BIG_NUM_ZERO
        weeklyTrades.timestamp = getWeekStartDate(event.block.timestamp);
        weeklyTrades.tradeVolume = BIG_NUM_ZERO
        weeklyTrades.profitLoss = BIG_NUM_ZERO
        weeklyTrades.tradeCount = 0
        weeklyTrades.winCount = 0 
        weeklyTrades.lossCount = 0
        weeklyTrades.leverage = BIG_NUM_ZERO
    }
    if (event.params.isPlus) {
        weeklyTrades.collateral = weeklyTrades.collateral.plus(event.params.amount)
    } else {
        weeklyTrades.collateral = weeklyTrades.collateral.minus(event.params.amount)
    }
    if (weeklyTrades.collateral.equals(BIG_NUM_ZERO)) {
        weeklyTrades.leverage = BIG_NUM_ZERO
    } else {
        weeklyTrades.leverage = weeklyTrades.tradeVolume.times(BigInt.fromString("1000")).div(weeklyTrades.collateral)
    }
    weeklyTrades.save()
    let allTrades = AllTrade.load(positionStatsEntity.account)
    if (!allTrades) {
    allTrades = new AllTrade(positionStatsEntity.account)
    allTrades.account = positionStatsEntity.account
    allTrades.collateral = BIG_NUM_ZERO
    allTrades.fees = BIG_NUM_ZERO
    allTrades.tradeVolume = BIG_NUM_ZERO
    allTrades.profitLoss = BIG_NUM_ZERO
    allTrades.tradeCount = 0
    allTrades.winCount = 0 
    allTrades.lossCount = 0
    allTrades.leverage = BIG_NUM_ZERO
    }
    if (event.params.isPlus) {
        allTrades.collateral = allTrades.collateral.plus(event.params.amount)
    } else {
        allTrades.collateral = allTrades.collateral.minus(event.params.amount)
    }
    if (allTrades.collateral.equals(BIG_NUM_ZERO)) {
        allTrades.leverage = BIG_NUM_ZERO
    } else {
        allTrades.leverage = allTrades.tradeVolume.times(BigInt.fromString("1000")).div(allTrades.collateral)
    }
    allTrades.save()
    if (event.params.isPlus) {
      positionStatsEntity.totalCollateral = positionStatsEntity.totalCollateral.plus(event.params.amount)
      positionStatsEntity.totalIncreasedCollateral = positionStatsEntity.totalIncreasedCollateral.plus(event.params.amount)
      if (event.params.collateral.gt(positionStatsEntity.maxCollateral)){
        positionStatsEntity.maxCollateral = event.params.collateral
      }
    } else {
      positionStatsEntity.totalCollateral = positionStatsEntity.totalCollateral.minus(event.params.amount)
    }
    positionStatsEntity.collateral = event.params.collateral
    positionStatsEntity.size = event.params.size
    positionStatsEntity.save()
    let tradeVolume = TradeVolume.load(positionStatsEntity.account);
    if (!tradeVolume) {
      tradeVolume = new TradeVolume(positionStatsEntity.account)
      tradeVolume.account = positionStatsEntity.account
      tradeVolume.size = BIG_NUM_ZERO
      tradeVolume.openLongs = BIG_NUM_ZERO
      tradeVolume.openShorts = BIG_NUM_ZERO
      tradeVolume.collateralUsage = BIG_NUM_ZERO
      tradeVolume.marginUsage = BIG_NUM_ZERO
      tradeVolume.vusdBalance = BIG_NUM_ZERO 
    }
    if (event.params.isPlus) {
        tradeVolume.collateralUsage = tradeVolume.collateralUsage.plus(event.params.amount)
    } else {
        tradeVolume.collateralUsage = tradeVolume.collateralUsage.minus(event.params.amount)
    }
    tradeVolume.save()
  }   
 }

 export function handleClosePosition(event: ClosePositionEvent): void {
    let positionStatsEntity = PositionStat.load(event.params.posId.toString())
    let closePositionEntity = new ClosePosition(event.params.posId.toString() + "-" + event.block.timestamp.toString())
    let feeUsd = event.params.posData[4].plus(event.params.pnlData[1]).plus(event.params.pnlData[2])
    let realisedPnl = event.params.pnlData[0].minus(event.params.posData[4])
    let newROI = BIG_NUM_ZERO
    if (positionStatsEntity) {
      if (positionStatsEntity.maxCollateral.gt(BIG_NUM_ZERO)) {
        newROI = BigInt.fromString('100000').times(realisedPnl).div(positionStatsEntity.maxCollateral)
      }
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
        tradeVolumeEntity.save()
      }
      if (positionStatsEntity.isLong) {
        tradeVolumeEntity.openLongs = tradeVolumeEntity.openLongs.minus(positionStatsEntity.size)
      } else {
        tradeVolumeEntity.openShorts = tradeVolumeEntity.openShorts.minus(positionStatsEntity.size)
      }
      tradeVolumeEntity.collateralUsage = tradeVolumeEntity.collateralUsage.minus(positionStatsEntity.collateral)
      tradeVolumeEntity.marginUsage = tradeVolumeEntity.marginUsage.plus(feeUsd)
      tradeVolumeEntity.size = tradeVolumeEntity.size.plus(positionStatsEntity.size)
      tradeVolumeEntity.save()
      closePositionEntity.account = positionStatsEntity.account
      closePositionEntity.tokenId = positionStatsEntity.tokenId
      closePositionEntity.isLong = positionStatsEntity.isLong
      closePositionEntity.posId = positionStatsEntity.posId
      processUserTradeStats(
        positionStatsEntity.posId,
        event.block.timestamp,
        positionStatsEntity.account,
        "CLOSE_POSITION",
        BIG_NUM_ZERO,
        positionStatsEntity.averagePrice,
        positionStatsEntity.collateral,
        event.params.posData[4],
        event.params.pnlData[1],
        event.params.pnlData[2],
        positionStatsEntity.isLong,
        true,
        true,
        event.params.posData[3],
        positionStatsEntity.positionType,
        realisedPnl,
        newROI,
        positionStatsEntity.size,
        positionStatsEntity.tokenId,
        event.transaction.hash.toHexString()
      )
      let hourlyTradesId = getAccountHourlyTradesId(positionStatsEntity.account, event.block.timestamp)
      let dailyTradesId = getAccountDailyTradesId(positionStatsEntity.account, event.block.timestamp)
      let hourlyVolumeId = getAccountHourlyTradesId(positionStatsEntity.tokenId.toString(), event.block.timestamp)
      let monthlyTradesId = getAccountMonthlyTradesId(positionStatsEntity.account, event.block.timestamp)
      let weeklyTradesId = getAccountWeeklyTradesId(positionStatsEntity.account, event.block.timestamp)
      processHourlyTrades(
        hourlyTradesId,
        positionStatsEntity.account, 
        positionStatsEntity.collateral, 
        feeUsd,
        realisedPnl.gt(BIG_NUM_ZERO),
        realisedPnl.lt(BIG_NUM_ZERO),
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
      processDailyTrades(
        dailyTradesId,
        positionStatsEntity.account, 
        positionStatsEntity.collateral, 
        feeUsd,
        realisedPnl.gt(BIG_NUM_ZERO),
        realisedPnl.lt(BIG_NUM_ZERO),
        realisedPnl,
        positionStatsEntity.size,
        event.block.timestamp
      )
      processMonthlyTrades(
        monthlyTradesId,
        positionStatsEntity.account, 
        positionStatsEntity.collateral, 
        feeUsd,
        realisedPnl.gt(BIG_NUM_ZERO),
        realisedPnl.lt(BIG_NUM_ZERO),
        realisedPnl,
        positionStatsEntity.size,
        event.block.timestamp
      )
      processWeeklyTrades(
        weeklyTradesId,
        positionStatsEntity.account, 
        positionStatsEntity.collateral, 
        feeUsd,
        realisedPnl.gt(BIG_NUM_ZERO),
        realisedPnl.lt(BIG_NUM_ZERO),
        realisedPnl,
        positionStatsEntity.size,
        event.block.timestamp
      )
      processAllTrades(
        positionStatsEntity.account, 
        positionStatsEntity.collateral, 
        feeUsd,
        realisedPnl.gt(BIG_NUM_ZERO),
        realisedPnl.lt(BIG_NUM_ZERO),
        realisedPnl,
        positionStatsEntity.size
      )
      let dailyGlobalInfoId = getAccountDailyTradesId("global", event.block.timestamp)
      let dailyGlobalInfo = DailyGlobalInfo.load(dailyGlobalInfoId)
      if (!dailyGlobalInfo) {
        dailyGlobalInfo = new DailyGlobalInfo(dailyGlobalInfoId)
        dailyGlobalInfo.fees = BIG_NUM_ZERO
        dailyGlobalInfo.timestamp = getDayStartDate(event.block.timestamp)
        dailyGlobalInfo.openInterests = BIG_NUM_ZERO
        dailyGlobalInfo.tradeVolume = BIG_NUM_ZERO
        dailyGlobalInfo.tradeCounts = 0
      }
      dailyGlobalInfo.fees = dailyGlobalInfo.fees.plus(feeUsd)
      dailyGlobalInfo.openInterests = dailyGlobalInfo.openInterests.minus(positionStatsEntity.size)
      dailyGlobalInfo.tradeVolume = dailyGlobalInfo.tradeVolume.plus(positionStatsEntity.size)
      dailyGlobalInfo.tradeCounts += 1
      dailyGlobalInfo.save()
      positionStatsEntity.closedAt = event.block.timestamp.toI32()
      positionStatsEntity.lastUpdateTime = event.block.timestamp.toI32()
      positionStatsEntity.closeHash = event.transaction.hash.toHexString()
      positionStatsEntity.positionFee = positionStatsEntity.positionFee.plus(event.params.posData[4])
      positionStatsEntity.fundingFee = positionStatsEntity.fundingFee.plus(event.params.pnlData[1])
      positionStatsEntity.borrowFee = positionStatsEntity.borrowFee.plus(event.params.pnlData[2])
      positionStatsEntity.markPrice = event.params.posData[3]
      positionStatsEntity.realisedPnl = positionStatsEntity.realisedPnl.plus(realisedPnl)
      positionStatsEntity.totalROI = positionStatsEntity.totalROI.plus(newROI)
      positionStatsEntity.positionStatus = "CLOSED"
      positionStatsEntity.save()
      let positionTriggerEntity = PositionTrigger.load(event.params.posId.toString())
      if (positionTriggerEntity) {
        positionTriggerEntity.status = "CLOSED";
        positionTriggerEntity.save()
      }
      processGlobalInfo(
        positionStatsEntity.tokenId, 
        positionStatsEntity.isLong, 
        event.params.pnlData[0].gt(BIG_NUM_ZERO),
        event.params.pnlData[0].lt(BIG_NUM_ZERO),
        event.params.pnlData[0],
        event.params.posData[4],
        positionStatsEntity.size)
    } else {
      closePositionEntity.account = '0x0000000000000000000000000000000000000420'
      closePositionEntity.tokenId = BIG_NUM_ZERO
      closePositionEntity.isLong = false
      closePositionEntity.posId = BIG_NUM_ZERO
    }
    closePositionEntity.realisedPnl = realisedPnl
    closePositionEntity.markPrice = event.params.posData[3]
    closePositionEntity.positionFee = event.params.posData[4]
    closePositionEntity.fundingFee = event.params.pnlData[1]
    closePositionEntity.borrowFee = event.params.pnlData[2]
    closePositionEntity.timestamp = event.block.timestamp.toI32()
    closePositionEntity.transactionHash = event.transaction.hash.toHexString()
    closePositionEntity.save()
  }
  
  export function handleDecreasePosition(event: DecreasePositionEvent): void {
    let decreasePositionEntity = new DecreasePosition(event.params.posId.toString() + "-" + event.block.timestamp.toString())
    let feeUsd = event.params.posData[4].plus(event.params.pnlData[1]).plus(event.params.pnlData[2])
    let realisedPnl = event.params.pnlData[0].minus(event.params.posData[4])
    decreasePositionEntity.account = event.params.account.toHexString()
    decreasePositionEntity.averagePrice = event.params.posData[2]
    decreasePositionEntity.collateral = event.params.posData[0]
    decreasePositionEntity.positionFee = event.params.posData[4]
    decreasePositionEntity.fundingFee = event.params.pnlData[1]
    decreasePositionEntity.borrowFee = event.params.pnlData[2]
    decreasePositionEntity.tokenId = event.params.tokenId
    decreasePositionEntity.isLong = event.params.isLong
    decreasePositionEntity.markPrice = event.params.posData[3]
    decreasePositionEntity.posId = event.params.posId
    decreasePositionEntity.realisedPnl = realisedPnl
    decreasePositionEntity.size = event.params.posData[1]
    decreasePositionEntity.timestamp = event.block.timestamp.toI32()
    decreasePositionEntity.transactionHash = event.transaction.hash.toHexString()
    decreasePositionEntity.save()
    let positionStatsEntity = PositionStat.load(event.params.posId.toString())
    if (positionStatsEntity) {
      positionStatsEntity.size = positionStatsEntity.size.minus(event.params.posData[1])
      positionStatsEntity.collateral = positionStatsEntity.collateral.minus(event.params.posData[0])
      positionStatsEntity.realisedPnl = positionStatsEntity.realisedPnl.plus(realisedPnl)
      let newROI = BIG_NUM_ZERO
      if (positionStatsEntity.maxCollateral.gt(BIG_NUM_ZERO)) {
        newROI = BigInt.fromString('100000').times(realisedPnl).div(positionStatsEntity.maxCollateral)
        positionStatsEntity.totalROI = positionStatsEntity.totalROI.plus(newROI)
      }
      processGlobalInfo(
        positionStatsEntity.tokenId, 
        positionStatsEntity.isLong, 
        realisedPnl.gt(BIG_NUM_ZERO),
        realisedPnl.lt(BIG_NUM_ZERO),
        realisedPnl,
        feeUsd,
        event.params.posData[1])
      positionStatsEntity.positionFee = positionStatsEntity.positionFee.plus(event.params.posData[4])
      positionStatsEntity.fundingFee = positionStatsEntity.fundingFee.plus(event.params.pnlData[1])
      positionStatsEntity.borrowFee = positionStatsEntity.borrowFee.plus(event.params.pnlData[2])
      positionStatsEntity.averagePrice = event.params.posData[2]
      positionStatsEntity.markPrice = event.params.posData[3]
      positionStatsEntity.lastUpdateTime = event.block.timestamp.toI32()
      positionStatsEntity.save()
      processUserTradeStats(
        event.params.posId,
        event.block.timestamp,
        event.params.account.toHexString(),
        "DECREASE_POSITION",
        BIG_NUM_ZERO,
        positionStatsEntity.averagePrice,
        event.params.posData[0],
        event.params.posData[4],
        event.params.pnlData[1],
        event.params.pnlData[2],
        event.params.isLong,
        true,
        true,
        event.params.posData[3],
        positionStatsEntity.positionType,
        realisedPnl,
        newROI,
        event.params.posData[1],
        event.params.tokenId,
        event.transaction.hash.toHexString()
      )
      let hourlyTradesId = getAccountHourlyTradesId(event.params.account.toHexString(), event.block.timestamp)
      let hourlyVolumeId = getAccountHourlyTradesId(event.params.tokenId.toString(), event.block.timestamp)
      let dailyTradesId = getAccountDailyTradesId(event.params.account.toHexString(), event.block.timestamp)
      let monthlyTradesId = getAccountMonthlyTradesId(event.params.account.toHexString(), event.block.timestamp)
      let weeklyTradesId = getAccountWeeklyTradesId(event.params.account.toHexString(), event.block.timestamp)
      processHourlyTrades(
        hourlyTradesId,
        event.params.account.toHexString(),
        event.params.posData[0],
        feeUsd,
        realisedPnl.gt(BIG_NUM_ZERO),
        realisedPnl.lt(BIG_NUM_ZERO),
        realisedPnl,
        event.params.posData[1],
        event.block.timestamp
      )
      let hourlyVolume = HourlyVolume.load(hourlyVolumeId)
      if (!hourlyVolume) {
        hourlyVolume = new HourlyVolume(hourlyVolumeId)
        hourlyVolume.amount = BIG_NUM_ZERO
        hourlyVolume.tokenId = event.params.tokenId
        hourlyVolume.timestamp = getHourStartDate(event.block.timestamp)
        hourlyVolume.tradeCounts = 0
      }
      hourlyVolume.amount = hourlyVolume.amount.plus(event.params.posData[1])
      hourlyVolume.tradeCounts += 1
      hourlyVolume.save()
      process24HVolume(event.params.tokenId.toString(), event.block.timestamp.toI32())
      processDailyTrades(
        dailyTradesId,
        event.params.account.toHexString(),
        event.params.posData[0],
        feeUsd,
        realisedPnl.gt(BIG_NUM_ZERO),
        realisedPnl.lt(BIG_NUM_ZERO),
        realisedPnl,
        event.params.posData[1],
        event.block.timestamp
      )
      processMonthlyTrades(
        monthlyTradesId,
        event.params.account.toHexString(),
        event.params.posData[0],
        feeUsd,
        realisedPnl.gt(BIG_NUM_ZERO),
        realisedPnl.lt(BIG_NUM_ZERO),
        realisedPnl,
        event.params.posData[1],
        event.block.timestamp
      )
      processWeeklyTrades(
        weeklyTradesId,
        event.params.account.toHexString(),
        event.params.posData[0],
        feeUsd,
        realisedPnl.gt(BIG_NUM_ZERO),
        realisedPnl.lt(BIG_NUM_ZERO),
        realisedPnl,
        event.params.posData[1],
        event.block.timestamp
      )
      processAllTrades(
        event.params.account.toHexString(),
        event.params.posData[0],
        feeUsd,
        realisedPnl.gt(BIG_NUM_ZERO),
        realisedPnl.lt(BIG_NUM_ZERO),
        realisedPnl,
        event.params.posData[1],
      )
      let dailyGlobalInfoId = getAccountDailyTradesId("global", event.block.timestamp)
      let dailyGlobalInfo = DailyGlobalInfo.load(dailyGlobalInfoId)
      if (!dailyGlobalInfo) {
        dailyGlobalInfo = new DailyGlobalInfo(dailyGlobalInfoId)
        dailyGlobalInfo.timestamp = getDayStartDate(event.block.timestamp)
        dailyGlobalInfo.fees = BIG_NUM_ZERO
        dailyGlobalInfo.openInterests = BIG_NUM_ZERO
        dailyGlobalInfo.tradeVolume = BIG_NUM_ZERO
        dailyGlobalInfo.tradeCounts = 0
        dailyGlobalInfo.save()
      }
      dailyGlobalInfo.fees = dailyGlobalInfo.fees.plus(feeUsd)
      dailyGlobalInfo.openInterests = dailyGlobalInfo.openInterests.minus(event.params.posData[1])
      dailyGlobalInfo.tradeVolume = dailyGlobalInfo.tradeVolume.plus(event.params.posData[1])
      dailyGlobalInfo.tradeCounts += 1
      dailyGlobalInfo.save()
    }
    let tradeVolumeEntity = TradeVolume.load(event.params.account.toHexString());
    if (!tradeVolumeEntity) {
      tradeVolumeEntity = new TradeVolume(event.params.account.toHexString())
      tradeVolumeEntity.account = event.params.account.toHexString()
      tradeVolumeEntity.size = BIG_NUM_ZERO
      tradeVolumeEntity.openLongs = BIG_NUM_ZERO
      tradeVolumeEntity.openShorts = BIG_NUM_ZERO
      tradeVolumeEntity.collateralUsage = BIG_NUM_ZERO
      tradeVolumeEntity.marginUsage = BIG_NUM_ZERO
      tradeVolumeEntity.vusdBalance = BIG_NUM_ZERO
      tradeVolumeEntity.save()
    }
    if (event.params.isLong) {
      tradeVolumeEntity.openLongs = tradeVolumeEntity.openLongs.minus(event.params.posData[1])
    } else {
      tradeVolumeEntity.openShorts = tradeVolumeEntity.openShorts.minus(event.params.posData[1])
    }
    tradeVolumeEntity.collateralUsage = tradeVolumeEntity.collateralUsage.minus(event.params.posData[0])
    tradeVolumeEntity.marginUsage = tradeVolumeEntity.marginUsage.plus(event.params.posData[4])
    tradeVolumeEntity.size = tradeVolumeEntity.size.plus(event.params.posData[1])
    tradeVolumeEntity.save()
  }
  
  export function handleIncreasePosition(event: IncreasePositionEvent): void {
    let increasePositionEntity = new IncreasePosition(event.params.posId.toString() + "-" + event.block.timestamp.toString())
    increasePositionEntity.account = event.params.account.toHexString()
    increasePositionEntity.averagePrice = event.params.posData[2]
    increasePositionEntity.collateral = event.params.posData[0]
    increasePositionEntity.tokenId = event.params.tokenId
    increasePositionEntity.isLong = event.params.isLong
    increasePositionEntity.feeUsd = event.params.posData[4]
    increasePositionEntity.markPrice = event.params.posData[3]
    increasePositionEntity.posId = event.params.posId
    increasePositionEntity.size = event.params.posData[1]
    increasePositionEntity.timestamp = event.block.timestamp.toI32()
    increasePositionEntity.transactionHash = event.transaction.hash.toHexString()
    increasePositionEntity.save()
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
      positionStatsEntity.createdAt = 0
      positionStatsEntity.createHash = ""
      positionStatsEntity.positionFee = BIG_NUM_ZERO
      positionStatsEntity.fundingFee = BIG_NUM_ZERO
      positionStatsEntity.fundingFee = BIG_NUM_ZERO
      positionStatsEntity.tokenId = event.params.tokenId
      positionStatsEntity.isLong = event.params.isLong
      positionStatsEntity.lastUpdateTime = 0
      positionStatsEntity.lmtPrice = BIG_NUM_ZERO
      positionStatsEntity.markPrice = BIG_NUM_ZERO
      positionStatsEntity.orderStatus = "FILLED"
      positionStatsEntity.pendingCollateral = BIG_NUM_ZERO
      positionStatsEntity.pendingDelayCollateral = BIG_NUM_ZERO
      positionStatsEntity.pendingDelaySize = BIG_NUM_ZERO
      positionStatsEntity.pendingSize = BIG_NUM_ZERO
      positionStatsEntity.posId = event.params.posId
      positionStatsEntity.positionStatus = "OPEN"
      positionStatsEntity.positionType = "Market Order"
      positionStatsEntity.realisedPnl = BIG_NUM_ZERO
      positionStatsEntity.size = BIG_NUM_ZERO
      positionStatsEntity.stpPrice = BIG_NUM_ZERO
    }
    if (positionStatsEntity.pendingDelayCollateral.gt(BIG_NUM_ZERO)) {
      processUserTradeStats(
        event.params.posId,
        event.block.timestamp,
        event.params.account.toHexString(),
        "ADD_POSITION",
        BIG_NUM_ZERO,
        event.params.posData[2],
        event.params.posData[0],
        event.params.posData[4],
        BIG_NUM_ZERO,
        BIG_NUM_ZERO,
        event.params.isLong,
        true,
        true,
        event.params.posData[3],
        positionStatsEntity.positionType,
        BIG_NUM_ZERO,
        BIG_NUM_ZERO,
        event.params.posData[1],
        event.params.tokenId,
        event.transaction.hash.toHexString()
      )
      positionStatsEntity.averagePrice = event.params.posData[2]
      positionStatsEntity.collateral = positionStatsEntity.collateral.plus(event.params.posData[0])
      if (positionStatsEntity.collateral.gt(positionStatsEntity.maxCollateral)){
        positionStatsEntity.maxCollateral = positionStatsEntity.collateral
      }
      positionStatsEntity.totalCollateral = positionStatsEntity.totalCollateral.plus(event.params.posData[0])
      positionStatsEntity.totalIncreasedCollateral = positionStatsEntity.totalIncreasedCollateral.plus(event.params.posData[0])
      positionStatsEntity.positionFee = positionStatsEntity.positionFee.plus(event.params.posData[4])
      positionStatsEntity.realisedPnl = positionStatsEntity.realisedPnl.minus(event.params.posData[4])
      positionStatsEntity.size = positionStatsEntity.size.plus(event.params.posData[1])
      positionStatsEntity.totalSize = positionStatsEntity.totalSize.plus(event.params.posData[1])
      positionStatsEntity.markPrice = event.params.posData[3]
      positionStatsEntity.lastUpdateTime = event.block.timestamp.toI32()
      positionStatsEntity.pendingDelayCollateral = BIG_NUM_ZERO
      positionStatsEntity.pendingDelaySize = BIG_NUM_ZERO
      positionStatsEntity.save()
    } else {
      positionStatsEntity.averagePrice = event.params.posData[2]
      positionStatsEntity.collateral = positionStatsEntity.collateral.plus(event.params.posData[0])
      if (positionStatsEntity.collateral.gt(positionStatsEntity.maxCollateral)){
        positionStatsEntity.maxCollateral = positionStatsEntity.collateral
      }
      positionStatsEntity.totalCollateral = positionStatsEntity.totalCollateral.plus(event.params.posData[0])
      positionStatsEntity.totalIncreasedCollateral = positionStatsEntity.totalIncreasedCollateral.plus(event.params.posData[0])
      positionStatsEntity.positionFee = positionStatsEntity.positionFee.plus(event.params.posData[4])
      positionStatsEntity.realisedPnl = positionStatsEntity.realisedPnl.minus(event.params.posData[4])
      positionStatsEntity.size = positionStatsEntity.size.plus(event.params.posData[1])
      positionStatsEntity.totalSize = positionStatsEntity.totalSize.plus(event.params.posData[1])
      positionStatsEntity.createdAt = event.block.timestamp.toI32()
      positionStatsEntity.createHash = event.transaction.hash.toHexString()
      positionStatsEntity.lastUpdateTime = event.block.timestamp.toI32()
      positionStatsEntity.markPrice = event.params.posData[3]
      positionStatsEntity.save()
      processUserTradeStats(
        event.params.posId,
        event.block.timestamp,
        event.params.account.toHexString(),
        "OPEN_POSITION",
        BIG_NUM_ZERO,
        event.params.posData[2],
        event.params.posData[0],
        event.params.posData[4],
        BIG_NUM_ZERO,
        BIG_NUM_ZERO,
        event.params.isLong,
        true,
        true,
        event.params.posData[3],
        positionStatsEntity.positionType,
        BIG_NUM_ZERO,
        BIG_NUM_ZERO,
        event.params.posData[1],
        event.params.tokenId,
        event.transaction.hash.toHexString()
      )
    }
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
    if (event.params.isLong) {
      tradeVolume.openLongs = tradeVolume.openLongs.plus(event.params.posData[1])
    } else {
      tradeVolume.openShorts = tradeVolume.openShorts.plus(event.params.posData[1])
    }
    tradeVolume.collateralUsage = tradeVolume.collateralUsage.plus(event.params.posData[0])
    tradeVolume.marginUsage = tradeVolume.marginUsage.plus(event.params.posData[4])
    tradeVolume.size = tradeVolume.size.plus(event.params.posData[1])
    tradeVolume.save()
    let hourlyVolumeId = getAccountHourlyTradesId(positionStatsEntity.tokenId.toString(), event.block.timestamp)
    let dailyTradesId = getAccountDailyTradesId(positionStatsEntity.account, event.block.timestamp)
    let hourlyTradesId = getAccountHourlyTradesId(positionStatsEntity.account, event.block.timestamp)
    let monthlyTradesId = getAccountMonthlyTradesId(positionStatsEntity.account, event.block.timestamp)
    let weeklyTradesId = getAccountWeeklyTradesId(positionStatsEntity.account, event.block.timestamp)
    processHourlyTrades(
      hourlyTradesId,
      positionStatsEntity.account,
      event.params.posData[0],
      event.params.posData[4],
      false,
      false,
      BIG_NUM_ZERO.minus(event.params.posData[4]),
      event.params.posData[1],
      event.block.timestamp
    )
    let hourlyVolume = HourlyVolume.load(hourlyVolumeId)
    if (!hourlyVolume) {
      hourlyVolume = new HourlyVolume(hourlyVolumeId)
      hourlyVolume.amount = BIG_NUM_ZERO
      hourlyVolume.tokenId = event.params.tokenId
      hourlyVolume.timestamp = getHourStartDate(event.block.timestamp)
      hourlyVolume.tradeCounts = 0
    }
    hourlyVolume.amount = hourlyVolume.amount.plus(event.params.posData[1])
    hourlyVolume.tradeCounts += 1
    hourlyVolume.save()
    process24HVolume(event.params.tokenId.toString(), event.block.timestamp.toI32())
    processDailyTrades(
      dailyTradesId,
      positionStatsEntity.account,
      event.params.posData[0],
      event.params.posData[4],
      false,
      false,
      BIG_NUM_ZERO.minus(event.params.posData[4]),
      event.params.posData[1],
      event.block.timestamp
    )
    processMonthlyTrades(
      monthlyTradesId,
      positionStatsEntity.account,
      event.params.posData[0],
      event.params.posData[4],
      false,
      false,
      BIG_NUM_ZERO.minus(event.params.posData[4]),
      event.params.posData[1],
      event.block.timestamp
    )
    processWeeklyTrades(
      weeklyTradesId,
      positionStatsEntity.account,
      event.params.posData[0],
      event.params.posData[4],
      false,
      false,
      BIG_NUM_ZERO.minus(event.params.posData[4]),
      event.params.posData[1],
      event.block.timestamp
    )
    processAllTrades(
      positionStatsEntity.account,
      event.params.posData[0],
      event.params.posData[4],
      false,
      false,
      BIG_NUM_ZERO.minus(event.params.posData[4]),
      event.params.posData[1],
    )
    let dailyGlobalInfoId = getAccountDailyTradesId("global", event.block.timestamp)
    let dailyGlobalInfo = DailyGlobalInfo.load(dailyGlobalInfoId)
    if (!dailyGlobalInfo) {
      dailyGlobalInfo = new DailyGlobalInfo(dailyGlobalInfoId)
      dailyGlobalInfo.timestamp = getHourStartDate(event.block.timestamp)      
      dailyGlobalInfo.fees = BIG_NUM_ZERO
      dailyGlobalInfo.openInterests = BIG_NUM_ZERO
      dailyGlobalInfo.tradeVolume = BIG_NUM_ZERO
      dailyGlobalInfo.tradeCounts = 0
      dailyGlobalInfo.save()
    }
    dailyGlobalInfo.fees = dailyGlobalInfo.fees.plus(event.params.posData[4])
    dailyGlobalInfo.openInterests = dailyGlobalInfo.openInterests.plus(event.params.posData[1])
    dailyGlobalInfo.tradeVolume = dailyGlobalInfo.tradeVolume.plus(event.params.posData[1])
    dailyGlobalInfo.tradeCounts += 1
    dailyGlobalInfo.save()
    processGlobalInfo(
      positionStatsEntity.tokenId, 
      positionStatsEntity.isLong, 
      false,
      false,
      BIG_NUM_ZERO.minus(event.params.posData[4]),
      event.params.posData[4],
      event.params.posData[1])
  }

 export function handleCreateAddPositionOrder(event: CreateAddPositionOrder): void {
    let positionStatsEntity = PositionStat.load(event.params.posId.toString())
    if (positionStatsEntity) {
        positionStatsEntity.pendingDelayCollateral = event.params.collateral
        positionStatsEntity.pendingDelaySize = event.params.size
        positionStatsEntity.save()
    }
 }

 export function handleAddPositionExecutionError(event: AddPositionExecutionError): void {
    
 }

 export function handleCreateDecreasePositionOrder(event: CreateDecreasePositionOrder): void {
    
 }

 export function handleDecreasePositionExecutionError(event: DecreasePositionExecutionError): void {

 }

 export function handleMarketOrderExecutionError(event: MarketOrderExecutionError): void {
    let positionStatsEntity = PositionStat.load(event.params.posId.toString())
    if (positionStatsEntity) {
      positionStatsEntity.orderStatus = "CANCELED";
      positionStatsEntity.positionStatus = "CANCELED"
      positionStatsEntity.closeHash = event.transaction.hash.toHexString()
      positionStatsEntity.save()
    }    
 }

 export function handleExecuteAddPositionOrder(event: ExecuteAddPositionOrder): void {
    let positionStatsEntity = PositionStat.load(event.params.posId.toString())
    if (positionStatsEntity) {
        positionStatsEntity.pendingDelayCollateral = BIG_NUM_ZERO
        positionStatsEntity.pendingDelaySize = BIG_NUM_ZERO
        positionStatsEntity.save()
    }
 }

 export function handleExecuteDecreasePositionOrder(event: ExecuteDecreasePositionOrder): void {
    
 }

