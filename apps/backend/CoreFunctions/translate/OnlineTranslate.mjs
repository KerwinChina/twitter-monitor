import { getTranslate } from '../../../../libs/core/Core.fetch.mjs'
import { Log, VerifyQueryString } from '../../../../libs/core/Core.function.mjs'
import { Translate } from '../../../../libs/core/Core.translate.mjs'
import { apiTemplate } from '../../../../libs/share/Constant.mjs'

const ApiTranslate = async (req, env) => {
    const target = VerifyQueryString(req.query.to, 'en')
    const platform = VerifyQueryString(req.query.platform, 'google').toLowerCase()
    const text = VerifyQueryString(req.postBody.get('text'), '')
    if (text) {
        let trInfo = { full_text: text, cache: false, target, translate_source: 'Twitter Monitor Translator', translate: '', entities: [] }

        const { message, content } = await Translate(trInfo, target, platform)
        if (!message) {
            return env.json(apiTemplate(200, 'OK', content, 'translate'))
        } else {
            return env.json(apiTemplate(500, 'Unable to get translate content', content, 'translate'))
        }
    } else {
        return env.json(apiTemplate(404, 'No translate text', {}, 'translate'))
    }
}

const ApiOfficialTranslate = async (req, env) => {
    const id = VerifyQueryString(req.query.id, '')
    if (!id) {
        return env.json(apiTemplate(403, 'Invalid id(tweet_id/uid)', {}, 'translate'))
    }
    const type = VerifyQueryString(req.query.type, 'tweets')
    const target = VerifyQueryString(req.query.target, 'en')

    try {
        const tmpTranslate = await getTranslate({ id, type, target, guest_token: env.guest_token2 })

        //updateGuestToken
        await env.updateGuestToken(env, 'guest_token2', 4, tmpTranslate.headers.get('x-rate-limit-remaining') < 1, 'Translation')

        if (tmpTranslate.data || (tmpTranslate.data?.translationState ?? '').toLowerCase() !== 'success') {
            let tmpReaponse = {
                full_text: tmpTranslate.data.translation,
                translate: tmpTranslate.data.translation,
                cache: false,
                target: tmpTranslate.data.destinationLanguage,
                translate_source: tmpTranslate.data.translationSource + ' (for Twitter)',
                entities: Object.keys(tmpTranslate.data.entities)
                    .map((key) =>
                        tmpTranslate.data.entities[key].map((value) => ({
                            expanded_url: ((key, value) => {
                                switch (key) {
                                    case 'hashtags':
                                        return `#/hashtag/${value.text}`
                                    case 'symbols':
                                        return `#/cashtag/${value.text}`
                                    case 'user_mentions':
                                        return `https://twitter.com/${value.screen_name}`
                                    case 'urls':
                                        return value.expanded_url
                                    default:
                                        return ''
                                }
                            })(key, value),
                            indices_end: value.indices[1],
                            indices_start: value.indices[0],
                            text: value.text ?? value.display_url ?? `@${value.screen_name}` ?? '',
                            type: key.slice(0, -1)
                        }))
                    )
                    .flat()
                    .sort((a, b) => a.indices_start - b.indices_start)
            }

            return env.json(apiTemplate(200, 'OK', tmpReaponse, 'translate'))
        } else {
            return env.json(apiTemplate(500, 'Unable to get translate content', {}, 'translate'))
        }
    } catch (e) {
        Log(false, 'error', e)
        return env.json(apiTemplate(500, 'Unable to get translate content', {}, 'translate'))
    }
}

export { ApiTranslate, ApiOfficialTranslate }
