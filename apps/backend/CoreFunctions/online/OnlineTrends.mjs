import { getTrends } from '../../../../libs/core/Core.fetch.mjs'
import { apiTemplate } from '../../../../libs/share/Constant.mjs'

const ApiTrends = async (req, env) => {
    let tmpTrends = []
    try {
        const tmpTrendsRequest = await getTrends({ initial_tab_id: 'trends', count: 20, guest_token: env.guest_token2 })

        //updateGuestToken
        await env.updateGuestToken(env, 'guest_token2', 1, tmpTrendsRequest.headers.get('x-rate-limit-remaining') < 20, 'Trending')

        tmpTrends = tmpTrendsRequest.data.timeline.instructions[1].addEntries.entries
            .filter((entity) => entity.entryId === 'trends')[0]
            .content.timelineModule.items.map((item) => ({
                name: item?.item?.content?.trend?.name ?? '',
                domainContext: item?.item?.content?.trend?.trendMetadata?.domainContext ?? '',
                metaDescription: item?.item?.content?.trend?.trendMetadata?.metaDescription ?? undefined,
                displayedRelatedVariants: item?.item?.clientEventInfo?.details?.guideDetails?.transparentGuideDetails?.trendMetadata?.displayedRelatedVariants ?? undefined
            }))
    } catch (e) {
        console.log(e)
        return env.json(apiTemplate(500, 'Ok', [], 'online'))
    }

    return env.json(apiTemplate(200, 'OK', tmpTrends, 'online'))
}

export { ApiTrends }
