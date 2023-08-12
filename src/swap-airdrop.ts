  import { BigInt } from "@graphprotocol/graph-ts"
  import {
    Claim as ClaimEvent,
    Swap as SwapEvent
    } from "../generated/SwapAndAirdrop/SwapAndAirdrop"

  import {
    AirdropDistributed
    } from "../generated/AirdropForHyperVLP/AirdropForHyperVLP"
      
  import {
      UserAirdropStat,
      UserVLPRewardStat
    } from "../generated/schema"

    export function handleClaim(event: ClaimEvent): void {
        let userAirdropStat = new UserAirdropStat(event.params.account.toHexString() + "-" + event.block.timestamp.toString())
        userAirdropStat.account = event.params.account.toHexString()
        if (event.params.isVela) {
            userAirdropStat.velaAmount = event.params.amount
        } else {
            userAirdropStat.velaAmount = event.params.amount.div(BigInt.fromString('2'))
        }
        userAirdropStat.isBluePill = event.params.isBluePill
        userAirdropStat.timestamp = event.block.timestamp.toI32()
        userAirdropStat.save()
    }

    export function handleSwap(event: SwapEvent): void {

    }

    export function handleAirdropDistributed(event: AirdropDistributed): void {
      let userVLPRewardStat = new UserVLPRewardStat(event.params.account.toHexString() + "-" + event.block.timestamp.toString())
      userVLPRewardStat.account = event.params.account.toHexString()
      userVLPRewardStat.amount = event.params.amount
      userVLPRewardStat.timestamp = event.block.timestamp.toI32()
      userVLPRewardStat.save()
    }