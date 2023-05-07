import { GenerateAccountInfo } from "../../../../libs/core/Core.account.mjs"
import { getListInfo, getListMember, getTypeahead } from "../../../../libs/core/Core.fetch.mjs"
import { GetEntitiesFromText, VerifyQueryString } from "../../../../libs/core/Core.function.mjs"
import { TweetsInfo } from "../../../../libs/core/Core.tweet.mjs"
import { apiTemplate } from "../../../../libs/share/Constant.mjs"


const ApiTypeahead = async (req, res) => {
    const text = VerifyQueryString(req.query.text, '')
    let tmpTypeahead = {
        users: [],
        topics: []
    }
    try {
        const tmpTypeaheadResponse = await getTypeahead({text, guest_token: global.guest_token2.token})
        //no rate limit
        //global.guest_token2.updateRateLimit('TypeAhead')

        tmpTypeahead.topics = tmpTypeaheadResponse.data.topics
        tmpTypeahead.users = tmpTypeaheadResponse.data.users.map(user => GenerateAccountInfo(user).GeneralAccountData)

    } catch (e) {
        console.log(e)
        console.error(`[${new Date()}]: #OnlineTypeahead #${text} #${e.code} ${e.message}`)
        res.json(apiTemplate(500, 'Something wrong', {users: [],topics: []}, 'online'))
        return
    }

    res.json(apiTemplate(200, 'OK', tmpTypeahead, 'online'))
}

const ApiListInfo = async (req, res) => {
    const listId = VerifyQueryString(req.query.list_id, 0)
    const screenName = VerifyQueryString(req.query.name, '').toLocaleLowerCase()
    const listSlug = VerifyQueryString(req.query.slug, '').toLocaleLowerCase()
    
    //all empty
    if (!(listId || (screenName && listSlug))) {
        res.json(apiTemplate(403, 'Invalid Request', {}, 'online'))
        return
    }

    try {
        let listInfoResponse = await getListInfo({id: listId ? listId : '', screenName, listSlug, guest_token: global.guest_token2.token, authorization: 1})
        global.guest_token2.updateRateLimit('ListInfo')

        if (!listInfoResponse.data) {
            res.json(apiTemplate(500, 'Songthing wrong', {}, 'online'))
            return
        }
        if (listId) {
            listInfoResponse = listInfoResponse.data.data.list
        } else {
            listInfoResponse = listInfoResponse.data.data.user_by_screen_name.list
        }
        
        
        //get user
        let {GeneralAccountData} = GenerateAccountInfo(listInfoResponse.user_results.result)
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
        let responseData = {
            user_info: GeneralAccountData,
            name: listInfoResponse.name??'',
            description: listInfoResponse.description??'',
            id: listInfoResponse.id_str??'',
            member_count: listInfoResponse.member_count??0,
            subscriber_count: listInfoResponse.subscriber_count??0,
            created_at: Math.ceil((listInfoResponse.created_at??0) / 1000),
            banner: {
                url: listInfoResponse?.custom_banner_media_results?.result?.media_info?.original_img_url??listInfoResponse?.default_banner_media_results?.result?.media_info?.original_img_url??'',
                original_height: listInfoResponse?.custom_banner_media_results?.result?.media_info?.original_img_height??listInfoResponse?.default_banner_media_results?.result?.media_info?.original_img_height??0,
                original_width: listInfoResponse?.custom_banner_media_results?.result?.media_info?.original_img_width??listInfoResponse?.default_banner_media_results?.result?.media_info?.original_img_width??0,
                media_key: listInfoResponse?.custom_banner_media_results?.result?.media_key??listInfoResponse?.default_banner_media_results?.result?.media_key??''
            }
        }

        res.json(apiTemplate(200, 'OK', responseData, 'online'))
    } catch (e) {
        console.log(e)
        console.error(`[${new Date()}]: #OnlineListInfo ${listId ? '#' + listId : '[@' + screenName + '](' + listSlug + ')'} #${e.code} ${e.message}`)
        res.json(apiTemplate(500, 'Songthing wrong', {}, 'online'))
        return
    }
}

const ApiListMemberList = async (req, res) => {
    const listId = VerifyQueryString(req.query.list_id, 0)
    const cursor = VerifyQueryString(req.query.cursor, '')
    const count = VerifyQueryString(req.query.count, 20)

    if (!(listId)) {
        res.json(apiTemplate(403, 'Invalid Request', {}, 'online'))
        return
    }

    try {
        let listMemberResponse = await getListMember({id: listId, cursor, count, guest_token: global.guest_token2.token, authorization: 1})
        global.guest_token2.updateRateLimit('ListMember')

        if (!listMemberResponse.data) {
            res.json(apiTemplate(500, 'Songthing wrong', {}, 'online'))
            return
        }

        const ParseList = TweetsInfo(listMemberResponse.data, true)

        res.json(apiTemplate(200, 'OK', {
            users: Object.entries(ParseList.users).map(user => {
                let {GeneralAccountData} = GenerateAccountInfo(user[1])
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
                return GeneralAccountData
            }),
            cursor: ParseList.cursor
        }, 'online'))
    } catch (e) {
        console.log(e)
        console.error(`[${new Date()}]: #OnlineListMemberList #${listId} #${e.code} ${e.message}`)
        res.json(apiTemplate(500, 'Songthing wrong', {}, 'online'))
        return
    }
}

export {ApiTypeahead, ApiListInfo, ApiListMemberList}