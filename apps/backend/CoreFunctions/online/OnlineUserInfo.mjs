import { GenerateAccountInfo } from "../../../../libs/core/Core.account.mjs"
import { getUserInfo } from "../../../../libs/core/Core.fetch.mjs"
import { GetEntitiesFromText, VerifyQueryString } from "../../../../libs/core/Core.function.mjs"
import { apiTemplate } from "../../../../libs/share/Constant.mjs"

const ApiUserInfo = async (req, res) => {
    const name = VerifyQueryString(req.query.name, '')
    const uid = VerifyQueryString(req.query.uid, '0')
    //TODO errors
    if (!(name || uid)) {
        return apiTemplate(404, 'No such account')
    }
    let userInfo = {}
    try {
        userInfo = await getUserInfo({user: name || uid, guest_token: global.guest_token2.token})
        if (!name) {
            global.guest_token2.updateRateLimit('UserByRestId')
        } else {
            global.guest_token2.updateRateLimit('UserByScreenName')
        }
    } catch (e) {
        console.error(`[${new Date()}]: #OnlineUserInfo #${name || uid} #${e.code} ${e.message}`)
        res.json(apiTemplate(e.code, e.message))
        return
    }
    let {GeneralAccountData} = GenerateAccountInfo(userInfo.data, {
        hidden: 0,
        lockes: 0,
        deleted: 0,
        organization: 0,
    })
    if (!GeneralAccountData.uid) {
        res.json(apiTemplate(404, 'No such account'))
        return
    }

    if (GeneralAccountData.description) {
        GeneralAccountData.description = GeneralAccountData.description.replaceAll("\n", "\n<br>")
    }
    
    GeneralAccountData.top = String(GeneralAccountData.top)
    GeneralAccountData.header = GeneralAccountData.header.replaceAll(/http(|s):\/\//gm, '')
    GeneralAccountData.uid_str = String(GeneralAccountData.uid)
    //GeneralAccountData.uid = Number(GeneralAccountData.uid)

    let originTextAndEntities = GetEntitiesFromText(GeneralAccountData.description)
    GeneralAccountData.description_origin = originTextAndEntities.originText
    GeneralAccountData.description_entities = originTextAndEntities.entities

    res.json(apiTemplate(200, 'OK', GeneralAccountData))
}

export {ApiUserInfo}