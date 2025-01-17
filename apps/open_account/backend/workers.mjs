import { Router } from 'itty-router'
import { apiTemplate } from '../../../libs/share/Constant.mjs'
import { PostBodyParser } from '../../cfworkers/share.mjs'
import { Log } from '../../../libs/core/Core.function.mjs'
import { shuffle } from 'lodash-es'

const workersApi = Router()

//favicon
workersApi.all('/favicon.ico', () => new Response(null, { status: 200 }))

//robots.txt
workersApi.all('/robots.txt', () => new Response('User-agent: *\nDisallow: /*', { status: 200 }))

workersApi.post(
    '/upload/account',
    async (req) => {
        await PostBodyParser(req, new Map([]))
    },
    async (req, env) => {
        const key = req.postBody.get('key')
        if (key !== env.SECRET_WORKERS_KEY) {
            return new Response(JSON.stringify(apiTemplate(403, 'Invalid key', {}, 'open_account_list')))
        }
        const config = JSON.parse(req.postBody.get('account'))
        if (!config?.user?.screen_name) {
            return new Response(JSON.stringify(apiTemplate(403, 'Invalid open account', {}, 'open_account_list')))
        }
        await env.open_accounts.put(`tm:open_account:${config.user.screen_name}`, req.postBody.get('account'), { expiration: Math.floor(Date.now() + 1000 * 60 * 60 * 24 * 30) / 1000 })
        return new Response(JSON.stringify(apiTemplate(200, 'OK', config.user, 'open_account_list')))
    }
)
workersApi.get('/data/random', async (req, env) => {
    const key = req.query.key
    const format = req.query.format === 'jsonl' ? 'jsonl' : 'json'
    if (key !== env.SECRET_WORKERS_KEY) {
        return new Response(JSON.stringify(apiTemplate(403, 'Invalid key', {}, 'open_account_list')))
    }
    const list = (await env.open_accounts.list({ prefix: 'tm:open_account:_LO_', limit: 1000 })).keys.filter((key) => key.expiration)
    let count = Number(req.query.count)
    if (count <= 0 || Number.isNaN(count)) {
        count = 1
    } else if (count > 25) {
        count = 25
    }
    const shuffledList = shuffle(list)
    const randomKey = (await Promise.allSettled(shuffledList.slice(0, count).map(async (tmpListItem) => JSON.parse(await env.open_accounts.get(tmpListItem.name))))).filter((key) => key.status === 'fulfilled').map((key) => key.value)
    if (format === 'jsonl') {
        return new Response(randomKey.map((key) => JSON.stringify(key)).join('\n'))
    } else {
        return new Response(JSON.stringify(apiTemplate(200, 'OK', randomKey, 'open_account_list')))
    }
})

workersApi.get('/data/account', async (req, env) => {
    const key = req.query.key
    if (key !== env.SECRET_WORKERS_KEY) {
        return new Response(JSON.stringify(apiTemplate(403, 'Invalid key', {}, 'open_account_list')))
    }
    const name = req.query.name
    if (!name || typeof name !== 'string') {
        return new Response(JSON.stringify(apiTemplate(403, 'Invalid name', {}, 'open_account_list')))
    }
    const account = await env.open_accounts.get('tm:open_account:' + name)
    if (!account) {
        return new Response(JSON.stringify(apiTemplate(404, 'Account not found', {}, 'open_account_list')))
    }
    return new Response(JSON.stringify(apiTemplate(200, 'OK', JSON.parse(account), 'open_account_list')))
})

workersApi.all('*', () => new Response(JSON.stringify(apiTemplate(403, 'Invalid Request', {}, 'open_account_list')), { status: 403 }))

export default {
    fetch: (req, env, ...args) =>
        workersApi.fetch(req, env, ...args).catch((e) => {
            Log(false, 'log', e)
            return new Response(JSON.stringify(apiTemplate(500, 'Unknown error', {}, 'open_account_list')), { status: 500 })
        })
}
