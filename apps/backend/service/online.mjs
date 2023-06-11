import express from 'express'
import {ApiUserInfo} from '../CoreFunctions/online/OnlineUserInfo.mjs'
import {ApiTweets, ApiSearch, ApiPoll, ApiAudioSpace, ApiMedia, ApiBroadcast} from '../CoreFunctions/online/OnlineTweet.mjs'
import { apiTemplate } from '../../../libs/share/Constant.mjs'
import { ApiTrends } from '../CoreFunctions/online/OnlineTrends.mjs'
import { ApiListInfo, ApiListMemberList, ApiTypeahead } from '../CoreFunctions/online/OnlineMisc.mjs'

const online = express()
online.use(async (req, res, next) => {
    if (global.dbmode) {
        res.json(apiTemplate(403, 'DB Mode is not included onlone api'))
        return
    }
    //await global.guest_token2.updateGuestToken(0)
    await req.env.guest_token2_handle.updateGuestToken(1)
    //if (global.guest_token2.token.nextActiveTime) {
    //    console.error(`[${new Date()}]: #Online #GuestToken #429 Wait until ${global.guest_token2.token.nextActiveTime}`)
    //    res.json(apiTemplate(429, `Wait until ${global.guest_token2.token.nextActiveTime}`))
    //} else 
    if (req.env.guest_token2_handle.token.nextActiveTime) {
        console.error(`[${new Date()}]: #Online #GuestToken #429 Wait until ${req.env.guest_token2_handle.token.nextActiveTime}`)
        res.json(apiTemplate(429, `Wait until ${req.env.guest_token2_handle.token.nextActiveTime}`))
    } else {
        req.env.guest_token2 = req.env.guest_token2_handle.token
        next()
    }
})

// online api
online.get('/data/accounts/', (req, res) => {
    res.json(apiTemplate(200, 'OK'))
})
online.get('/data/userinfo/', async (req, res) => {
    const _res = await ApiUserInfo(req, req.env)
    res.json(_res.data)
})
online.get('/data/tweets/', async (req, res) => {
    const _res = await ApiTweets(req, req.env)
    res.json(_res.data)
})
online.get('/data/chart/', (req, res) => {
    res.json(apiTemplate(200, 'No record found', []))
})
online.get(/^\/data\/(hashtag|cashtag|search)(\/|)$/, async (req, res) => {
    req.type = req.params[0] || ''
    const _res = await ApiSearch(req, req.env)
    res.json(_res.data)
})
online.get('/data/poll/', async (req, res) => {
    const _res = await ApiPoll(req, req.env)
    res.json(_res.data)
})
online.get('/data/audiospace/', async (req, res) => {
    const _res = await ApiAudioSpace(req, req.env)
    res.json(_res.data)
})
online.get('/data/broadcast/', async (req, res) => {
    const _res = await ApiBroadcast(req, req.env)
    res.json(_res.data)
})
online.get('/data/media/', async (req, res) => {
    const _res = await ApiMedia(req, req.env)
    res.json(_res.data)
})
online.get('/data/trends/', async (req, res) => {
    const _res = await ApiTrends(req, req.env)
    res.json(_res.data)
})
online.get('/data/typeahead/', async (req, res) => {
    const _res = await ApiTypeahead(req, req.env)
    res.json(_res.data)
})
online.get('/data/listinfo/', async (req, res) => {
    const _res = await ApiListInfo(req, req.env)
    res.json(_res.data)
})
online.get('/data/listmember/', async (req, res) => {
    const _res = await ApiListMemberList(req, req.env)
    res.json(_res.data)
})

export default online