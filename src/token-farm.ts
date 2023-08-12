import {
    EmergencyWithdraw,
    FarmDeposit,
    FarmWithdraw,
    VestingClaim,
    VestingDeposit,
    VestingTransfer,
    VestingWithdraw,
    MintVestingToken
} from "../generated/TokenFarm/TokenFarm"

import {
    PoolInfo, RewardInfo, RewardStat, VestingStat, Rewarder
} from "../generated/schema"
import {
    AddRewardInfo as AddRewardInfo1,
    AddPool as AddPool1,
    OnReward as OnReward1,
    RewardRateUpdated as RewardRateUpdated1,
    UpdatePool as UpdatePool1
} from "../generated/ComplexRewardPerSec1/ComplexRewardPerSec"

import {
    AddRewardInfo as AddRewardInfo2,
    AddPool as AddPool2,
    OnReward as OnReward2,
    RewardRateUpdated as RewardRateUpdated2,
    UpdatePool as UpdatePool2
} from "../generated/ComplexRewardPerSec2/ComplexRewardPerSec"

import {
    AddRewardInfo as AddRewardInfo3,
    AddPool as AddPool3,
    OnReward as OnReward3,
    RewardRateUpdated as RewardRateUpdated3,
    UpdatePool as UpdatePool3
} from "../generated/ComplexRewardPerSec3/ComplexRewardPerSec"
import { BIG_NUM_ZERO, REWARDER1_ADDRESS, REWARDER2_ADDRESS, REWARDER3_ADDRESS, VELA_ADDRESS, EVELA_ADDRESS, VLP_ADDRESS } from "./constants"
export function handleEmergencyWithdraw(event: EmergencyWithdraw): void {
    
}

export function handleFarmDeposit(event: FarmDeposit): void {
    let userPoolInfo = PoolInfo.load(event.params.user.toHexString())
    if (!userPoolInfo) {
        userPoolInfo = new PoolInfo(event.params.user.toHexString())
        userPoolInfo.pid1 = BIG_NUM_ZERO
        userPoolInfo.pid2 = BIG_NUM_ZERO
        userPoolInfo.pid3 = BIG_NUM_ZERO
    }
    let allPoolInfo = PoolInfo.load("all")
    if (!allPoolInfo) {
        allPoolInfo = new PoolInfo("all")
        allPoolInfo.pid1 = BIG_NUM_ZERO
        allPoolInfo.pid2 = BIG_NUM_ZERO
        allPoolInfo.pid3 = BIG_NUM_ZERO
    }
    if (event.params.token.toHexString() == VLP_ADDRESS.toLowerCase()) {
        userPoolInfo.pid1 = userPoolInfo.pid1.plus(event.params.amount)
        allPoolInfo.pid1 = allPoolInfo.pid1.plus(event.params.amount)
    } else if (event.params.token.toHexString() == VELA_ADDRESS.toLowerCase()) {
        userPoolInfo.pid2 = userPoolInfo.pid2.plus(event.params.amount)
        allPoolInfo.pid2 = allPoolInfo.pid2.plus(event.params.amount)
    } else if (event.params.token.toHexString() == EVELA_ADDRESS.toLowerCase()) {
        userPoolInfo.pid3 = userPoolInfo.pid3.plus(event.params.amount)
        allPoolInfo.pid3 = allPoolInfo.pid3.plus(event.params.amount)
    }
    userPoolInfo.save()
    allPoolInfo.save()
}

export function handleFarmWithdraw(event: FarmWithdraw): void {
    let userPoolInfo = PoolInfo.load(event.params.user.toHexString())
    if (!userPoolInfo) {
        userPoolInfo = new PoolInfo(event.params.user.toHexString())
        userPoolInfo.pid1 = BIG_NUM_ZERO
        userPoolInfo.pid2 = BIG_NUM_ZERO
        userPoolInfo.pid3 = BIG_NUM_ZERO
    }
    let allPoolInfo = PoolInfo.load("all")
    if (!allPoolInfo) {
        allPoolInfo = new PoolInfo("all")
        allPoolInfo.pid1 = BIG_NUM_ZERO
        allPoolInfo.pid2 = BIG_NUM_ZERO
        allPoolInfo.pid3 = BIG_NUM_ZERO
    }
    if (event.params.token.toHexString() == VLP_ADDRESS.toLowerCase()) {
        userPoolInfo.pid1 = userPoolInfo.pid1.minus(event.params.amount)
        allPoolInfo.pid1 = allPoolInfo.pid1.minus(event.params.amount)
    } else if (event.params.token.toHexString() == VELA_ADDRESS.toLowerCase()) {
        userPoolInfo.pid2 = userPoolInfo.pid2.minus(event.params.amount)
        allPoolInfo.pid2 = allPoolInfo.pid2.minus(event.params.amount)
    } else if (event.params.token.toHexString() == EVELA_ADDRESS.toLowerCase()) {
        userPoolInfo.pid3 = userPoolInfo.pid3.minus(event.params.amount)
        allPoolInfo.pid3 = allPoolInfo.pid3.minus(event.params.amount)
    }
    userPoolInfo.save()
    allPoolInfo.save()      
}

export function handleVestingClaim(event: VestingClaim): void {
    let vestingStats = VestingStat.load(event.params.receiver.toHexString())
    if (!vestingStats) {
        vestingStats = new VestingStat(event.params.receiver.toHexString())
        vestingStats.account = event.params.receiver.toHexString()
        vestingStats.claimedAmount = BIG_NUM_ZERO
        vestingStats.lockedAmount = BIG_NUM_ZERO
    }
    vestingStats.claimedAmount = vestingStats.claimedAmount.plus(event.params.amount)
    vestingStats.lockedAmount = vestingStats.lockedAmount.minus(event.params.amount)
    vestingStats.save()
    let allVestingStats = VestingStat.load("all")
    if (!allVestingStats) {
        allVestingStats = new VestingStat("all")
        allVestingStats.account = "all"
        allVestingStats.claimedAmount = BIG_NUM_ZERO
        allVestingStats.lockedAmount = BIG_NUM_ZERO
    }
    allVestingStats.claimedAmount = allVestingStats.claimedAmount.plus(event.params.amount)
    allVestingStats.lockedAmount = allVestingStats.lockedAmount.minus(event.params.amount)
    allVestingStats.save()
}

export function handleVestingDeposit(event: VestingDeposit): void {
    let vestingStats = VestingStat.load(event.params.account.toHexString())
    if (!vestingStats) {
        vestingStats = new VestingStat(event.params.account.toHexString())
        vestingStats.account = event.params.account.toHexString()
        vestingStats.claimedAmount = BIG_NUM_ZERO
        vestingStats.lockedAmount = BIG_NUM_ZERO
    }
    vestingStats.lockedAmount = vestingStats.lockedAmount.plus(event.params.amount)
    vestingStats.save()
    let allVestingStats = VestingStat.load("all")
    if (!allVestingStats) {
        allVestingStats = new VestingStat("all")
        allVestingStats.account = "all"
        allVestingStats.claimedAmount = BIG_NUM_ZERO
        allVestingStats.lockedAmount = BIG_NUM_ZERO
    }
    allVestingStats.lockedAmount = allVestingStats.lockedAmount.plus(event.params.amount)
    allVestingStats.save()
}

export function handleVestingTransfer(event: VestingTransfer): void {
      
}

export function handleVestingWithdraw(event: VestingWithdraw): void {
      
}

export function handleAddPool1(event: AddPool1): void {
}

export function handleAddPool2(event: AddPool2): void {
}

export function handleAddPool3(event: AddPool3): void {
}

export function handleAddRewardInfo1(event: AddRewardInfo1): void {
    let addRewardInfo = RewardInfo.load(event.params.pid.toString() + "-" + REWARDER1_ADDRESS.toLowerCase())
    if (!addRewardInfo) {
        addRewardInfo = new RewardInfo(event.params.pid.toString() + "-" + REWARDER1_ADDRESS.toLowerCase())
        addRewardInfo.pId = event.params.pid
        addRewardInfo.address = REWARDER1_ADDRESS.toLowerCase()
        addRewardInfo.startTimestamp = event.block.timestamp.toI32()
        addRewardInfo.save()
    }
    let rewarder = new Rewarder(REWARDER1_ADDRESS.toLowerCase() + "-" + event.block.timestamp.toString())
    rewarder.info = addRewardInfo.id;
    rewarder.timestamp = event.block.timestamp.toI32()
    rewarder.rewardPerSec = event.params.rewardPerSec
    rewarder.endTimestamp = event.params.endTimestamp.toI32()
    rewarder.save()
    addRewardInfo.save()
}

export function handleAddRewardInfo2(event: AddRewardInfo2): void {
    let addRewardInfo = RewardInfo.load(event.params.pid.toString() + "-" + REWARDER2_ADDRESS.toLowerCase())
    if (!addRewardInfo) {
        addRewardInfo = new RewardInfo(event.params.pid.toString() + "-" + REWARDER2_ADDRESS.toLowerCase())
        addRewardInfo.pId = event.params.pid
        addRewardInfo.address = REWARDER2_ADDRESS.toLowerCase()
        addRewardInfo.startTimestamp = event.block.timestamp.toI32()
        addRewardInfo.save()
    }
    let rewarder = new Rewarder(REWARDER2_ADDRESS.toLowerCase() + "-" + event.block.timestamp.toString())
    rewarder.info = addRewardInfo.id;
    rewarder.timestamp = event.block.timestamp.toI32()
    rewarder.rewardPerSec = event.params.rewardPerSec
    rewarder.endTimestamp = event.params.endTimestamp.toI32()
    rewarder.save()
    addRewardInfo.save()
}

export function handleAddRewardInfo3(event: AddRewardInfo3): void {
    let addRewardInfo = RewardInfo.load(event.params.pid.toString() + "-" + REWARDER3_ADDRESS.toLowerCase())
    if (!addRewardInfo) {
        addRewardInfo = new RewardInfo(event.params.pid.toString() + "-" + REWARDER3_ADDRESS.toLowerCase())
        addRewardInfo.pId = event.params.pid
        addRewardInfo.address = REWARDER3_ADDRESS.toLowerCase()
        addRewardInfo.startTimestamp = event.block.timestamp.toI32()
        addRewardInfo.save()
    }
    let rewarder = new Rewarder(REWARDER3_ADDRESS.toLowerCase() + "-" + event.block.timestamp.toString())
    rewarder.info = addRewardInfo.id;
    rewarder.timestamp = event.block.timestamp.toI32()
    rewarder.rewardPerSec = event.params.rewardPerSec
    rewarder.endTimestamp = event.params.endTimestamp.toI32()
    rewarder.save()
    addRewardInfo.save()
}

export function handleOnReward1(event: OnReward1): void {
    let account = event.params.user.toHexString()
    let rewardStats = RewardStat.load(REWARDER1_ADDRESS.toLowerCase() + "-" + account)
    if (!rewardStats) {
        rewardStats = new RewardStat(REWARDER1_ADDRESS.toLowerCase() + "-" + account)
        rewardStats.rewarder = REWARDER1_ADDRESS.toLowerCase()
        rewardStats.account = account
        rewardStats.amount = BIG_NUM_ZERO
    }
    rewardStats.amount = rewardStats.amount.plus(event.params.amount)
    rewardStats.save()

    let allRewardStats = RewardStat.load(REWARDER1_ADDRESS.toLowerCase() + "-" + "all")
    if (!allRewardStats) {
        allRewardStats = new RewardStat(REWARDER1_ADDRESS.toLowerCase() + "-" + "all")
        allRewardStats.rewarder = REWARDER1_ADDRESS.toLowerCase()
        allRewardStats.account = "all"
        allRewardStats.amount = BIG_NUM_ZERO
    }
    allRewardStats.amount = allRewardStats.amount.plus(event.params.amount)
    allRewardStats.save()
}

export function handleOnReward2(event: OnReward2): void {
    let account = event.params.user.toHexString()
    let rewardStats = RewardStat.load(REWARDER2_ADDRESS.toLowerCase() + "-" + account)
    if (!rewardStats) {
        rewardStats = new RewardStat(REWARDER2_ADDRESS.toLowerCase() + "-" + account)
        rewardStats.rewarder = REWARDER2_ADDRESS.toLowerCase()
        rewardStats.account = account
        rewardStats.amount = BIG_NUM_ZERO
    }
    rewardStats.amount = rewardStats.amount.plus(event.params.amount)
    rewardStats.save()
    let allRewardStats = RewardStat.load(REWARDER2_ADDRESS.toLowerCase() + "-" + "all")
    if (!allRewardStats) {
        allRewardStats = new RewardStat(REWARDER2_ADDRESS.toLowerCase() + "-" + "all")
        allRewardStats.rewarder = REWARDER2_ADDRESS.toLowerCase()
        allRewardStats.account = "all"
        allRewardStats.amount = BIG_NUM_ZERO
    }
    allRewardStats.amount = allRewardStats.amount.plus(event.params.amount)
    allRewardStats.save()
}

export function handleOnReward3(event: OnReward3): void {
    let account = event.params.user.toHexString()
    let rewardStats = RewardStat.load(REWARDER3_ADDRESS.toLowerCase() + "-" + account)
    if (!rewardStats) {
        rewardStats = new RewardStat(REWARDER3_ADDRESS.toLowerCase() + "-" + account)
        rewardStats.rewarder = REWARDER3_ADDRESS.toLowerCase()
        rewardStats.account = account
        rewardStats.amount = BIG_NUM_ZERO
    }
    rewardStats.amount = rewardStats.amount.plus(event.params.amount)
    rewardStats.save()
    let allRewardStats = RewardStat.load(REWARDER3_ADDRESS.toLowerCase() + "-" + "all")
    if (!allRewardStats) {
        allRewardStats = new RewardStat(REWARDER3_ADDRESS.toLowerCase() + "-" + "all")
        allRewardStats.rewarder = REWARDER3_ADDRESS.toLowerCase()
        allRewardStats.account = "all"
        allRewardStats.amount = BIG_NUM_ZERO
    }
    allRewardStats.amount = allRewardStats.amount.plus(event.params.amount)
    allRewardStats.save()
}

export function handleRewardRateUpdated1(event: RewardRateUpdated1): void {

}

export function handleRewardRateUpdated2(event: RewardRateUpdated2): void {

}

export function handleRewardRateUpdated3(event: RewardRateUpdated3): void {

}

export function handleUpdatePool1(event: UpdatePool1): void {

}

export function handleUpdatePool2(event: UpdatePool2): void {

}

export function handleUpdatePool3(event: UpdatePool3): void {

}

export function handleMintVestingToken(event: MintVestingToken): void {

}