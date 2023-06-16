import V2TwitterPolls from '../../libs/model/twitter_monitor/v2_twitter_polls.js'
import V2TwitterCards from '../../libs/model/twitter_monitor/v2_twitter_cards.js'
import { Op } from 'sequelize'
import { Time2SnowFlake } from '../../libs/core/Core.tweet.mjs'
import dbHandle from '../../libs/core/Core.db.mjs'
import { getAudioSpace, getPollResult, getToken } from '../../libs/core/Core.fetch.mjs'
//import { TGPush } from '../../libs/core/Core.push.mjs'

const now = Math.floor(Date.now() / 1000) - 300

// POLLS
const polls = await V2TwitterPolls.findAll({
    attributes: ['origin_tweet_id', 'poll_order', 'uid'],
    where: {
        end_datetime: { [Op.lt]: now },
        count: 0,
        checked: 0,
        origin_tweet_id: { [Op.ne]: 0 }
    },
    order: ['origin_tweet_id']
})

const tweetIdList = [...new Set(polls.map((poll) => poll.origin_tweet_id))]

let get_token = await getToken()
if (!get_token.success) {
    console.log('tmv3: no token #noToken #polls')
    process.exit()
}

let t = await dbHandle.twitter_monitor.transaction()
for (const idIndex in tweetIdList) {
    if (idIndex % 950 === 0) {
        get_token = await getToken()
        if (!get_token.success) {
            console.log('tmv3: no token #noToken #polls')
            process.exit()
        }
    }
    console.log(`-->${tweetIdList[idIndex]}<--`)
    const pollData = await getPollResult({ tweet_id: tweetIdList[idIndex], guest_token: get_token })
    if (pollData.code !== 200) {
        console.log(`tmv3: ${pollData.message} (${tweetIdList[idIndex]}) #errorpoll`)
        //TGPush(`tmv3: ${pollData.message} (${tweetIdList[idIndex]}) #errorpoll`)
        await V2TwitterPolls.update(
            { count: 0, checked: 1 },
            {
                where: {
                    origin_tweet_id: tweetIdList[idIndex]
                },
                transaction: t
            }
        )
    } else {
        for (const pollDataIndex in pollData.data) {
            console.log(`${tweetIdList[idIndex]}: #${Number(pollDataIndex) + 1} > ${pollData.data[pollDataIndex]}`)
            await V2TwitterPolls.update(
                {
                    count: pollData.data[pollDataIndex],
                    checked: 1
                },
                {
                    where: {
                        origin_tweet_id: tweetIdList[idIndex],
                        poll_order: Number(pollDataIndex) + 1
                    },
                    transaction: t
                }
            )
        }
    }
}

await t.commit()

//audio space
const AudioSpaces = await V2TwitterCards.findAll({
    attributes: ['url'],
    where: {
        tweet_id: { [Op.gt]: Time2SnowFlake(new Date() - 25920000000) },
        type: 'audiospace',
        description: ''
    }
})
const audioSpaceList = [...new Set(AudioSpaces.map((AudioSpace) => AudioSpace.url))]

t = await dbHandle.twitter_monitor.transaction()
for (const audioSpaceId of audioSpaceList) {
    const tmpAudioSpaceResult = await getAudioSpace({ id: audioSpaceId, guest_token: get_token })
    if (tmpAudioSpaceResult.data.data.audioSpace.metadata) {
        await V2TwitterCards.update(
            {
                description: tmpAudioSpaceResult.data.data.audioSpace?.metadata?.title ?? null
            },
            {
                where: { url: audioSpaceId },
                transaction: t
            }
        )
        console.log(`tmv3: ->${audioSpaceId}<- success '${tmpAudioSpaceResult.data.data.audioSpace?.metadata?.title}'`)
    } else {
        await V2TwitterCards.update(
            {
                description: null
            },
            {
                where: { url: audioSpaceId },
                transaction: t
            }
        )
        console.log(`tmv3: ->${audioSpaceId}<- not exist`)
    }
}

await t.commit()
process.exit()
