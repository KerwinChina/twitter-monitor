import { VerifiedInt } from '../share/Constant.mjs'
import path2array from './Core.apiPath.mjs'

const GenerateAccountInfo = (accountDataOriginal, extAccountData = {}) => {
    let GeneralAccountData = {
        uid: 0,
        name: '',
        display_name: '',
        header: '',
        banner: '',
        following: 0,
        followers: 0,
        media_count: 0,
        created_at: 0,
        description: '',
        description_original: '',
        verified: '',
        top: '0',
        statuses_count: 0 //推文计数
    }
    let monitorDataInfo = {
        uid: 0,
        name: '',
        display_name: '',
        following: 0,
        followers: 0,
        statuses_count: 0,
        timestamp: Math.floor(new Date() / 1000)
        //"description: "",
    }
    let update = false
    const accountDataIdStr = path2array('rest_id', accountDataOriginal) || 0
    const accountData = path2array('user_info_legacy', accountDataOriginal)
    //banner
    if (accountData.profile_banner_url) {
        GeneralAccountData.banner = accountData.profile_banner_url.replaceAll(/.*\/([\d]+)$/gm, '$1')
        update = true
    } else {
        GeneralAccountData.banner = 0
    }

    GeneralAccountData.uid = monitorDataInfo.uid = accountDataIdStr
    GeneralAccountData.name = monitorDataInfo.name = accountData.screen_name
    GeneralAccountData.display_name = monitorDataInfo.display_name = accountData.name

    if (accountData.profile_image_url_https) {
        GeneralAccountData.header = accountData.profile_image_url_https.replaceAll(/\/([0-9]+|default_profile_images)\/([\w\-]+)_normal.([\w]+)$/gm, '/$1/$2.$3')
    }

    GeneralAccountData.following = monitorDataInfo.following = accountData.friends_count
    GeneralAccountData.followers = monitorDataInfo.followers = accountData.followers_count
    GeneralAccountData.media_count = monitorDataInfo.media_count = accountData.media_count
    GeneralAccountData.statuses_count = monitorDataInfo.statuses_count = accountData.statuses_count
    GeneralAccountData.created_at = Math.floor(Date.parse(accountData.created_at) / 1000)
    GeneralAccountData.verified = VerifiedInt(accountData.verified, path2array('user_is_blue_verified', accountDataOriginal), accountData.ext_verified_type || accountData.verified_type || false)

    //for verify
    // 0 or '' or null:  none,
    // 10000000: only legacy mark
    // 01000000: only blue mark // first bit means blue mark
    // 11000000: both
    // 11000001: order in verified_type list // this list is updated manually
    //GeneralAccountData.lang = accountData.lang

    //from php version and i forge why i did it
    //$this->GeneralAccountData["top"] = (string)($this->account_data["pinned_tweet_ids_str"][0]??(($this->account_data["pinned_tweet_ids"]??'0') ? number_format($this->account_data["pinned_tweet_ids"][0], 0, '', '') : "0"));
    GeneralAccountData.top = accountData.pinned_tweet_ids_str?.length ? accountData.pinned_tweet_ids_str[0] : '0'

    let description = accountData.description
    GeneralAccountData.description_original = description
    if (accountData.entities?.description.urls) {
        for (const entity of accountData.entities.description.urls) {
            description = description.replaceAll(entity.url, '<a href="' + entity.expanded_url + '" target="_blank">' + entity.display_url + '</a>')
        }
    }
    GeneralAccountData.description = description
    GeneralAccountData = Object.assign(GeneralAccountData, extAccountData)
    return { GeneralAccountData, ...GeneralAccountData, monitorDataInfo, update }
}

const GenerateCommunityInfo = (communityDataOriginal, communityDataExtra = {}) => {
    return {
        //admin_results: [],
        name: communityDataOriginal.name ?? '',
        description: communityDataOriginal.description ?? '',
        id: communityDataOriginal.id_str ?? '',
        member_count: communityDataOriginal.member_count ?? 0,
        moderator_count: communityDataOriginal.moderator_count ?? 0,
        default_theme: communityDataOriginal.default_theme ?? '_',
        created_at: Math.ceil((communityDataOriginal.created_at ?? 0) / 1000),
        rules: communityDataOriginal.rules ? communityDataOriginal.rules.map((rule) => ({ name: rule.name, description: rule.description })) : [],
        join_policy: communityDataOriginal.join_policy ?? 'Unknown',
        banner: {
            url: communityDataOriginal?.custom_banner_media?.media_info?.original_img_url ?? communityDataOriginal?.default_banner_media?.media_info?.original_img_url ?? '',
            original_height: communityDataOriginal?.custom_banner_media?.media_info?.original_img_height ?? communityDataOriginal?.default_banner_media?.media_info?.original_img_height ?? 0,
            original_width: communityDataOriginal?.custom_banner_media?.media_info?.original_img_width ?? communityDataOriginal?.default_banner_media?.media_info?.original_img_width ?? 0,
            media_key: communityDataOriginal?.custom_banner_media?.id ?? communityDataOriginal?.default_banner_media?.id ?? ''
        }
    }
}

export { GenerateAccountInfo, GenerateCommunityInfo }
