// Twitter Archiver
// @BANKA2017 && NEST.MOE
// retryMedia()

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { getImage } from '../../libs/core/Core.fetch.mjs'
import { Log } from '../../libs/core/Core.function.mjs'

const basePath = './twitter_archiver' // ./twitter_archiver

if (!existsSync(basePath + '/twitter_monitor_media_failed_list.json')) {
    Log(false, 'log', 'archiver: need not retry')
}
let getMediaFailedList = []
let statusCount = { success: 0, error: 0 }
const mediaList = JSON.parse(readFileSync(basePath + '/twitter_monitor_media_failed_list.json'))

for (let mediaIndex = 0; mediaIndex < mediaList.length; ) {
    const tmpMediaList = mediaList.slice(mediaIndex, mediaIndex + 99)
    await Promise.allSettled(
        tmpMediaList.map(
            (mediaItem) =>
                new Promise((resolve, reject) => {
                    getImage(mediaItem.url)
                        .then((response) => {
                            resolve({ imageBuffer: response.data, meta: mediaItem })
                        })
                        .catch((e) => {
                            reject({ imageBuffer: null, meta: mediaItem })
                        })
                })
        )
    )
        .then((response) => {
            response.forEach((imageReaponse) => {
                if (imageReaponse.status === 'fulfilled' && imageReaponse.value.imageBuffer) {
                    writeFileSync(basePath + `/savemedia/${imageReaponse.value.meta.basename}`, imageReaponse.value.imageBuffer)
                    statusCount.success++
                    Log(false, 'log', `${imageReaponse.value.meta.url}\tsuccess: ${statusCount.success}, error: ${statusCount.error}, ${statusCount.success + statusCount.error} / ${mediaList.length}`)
                } else {
                    getMediaFailedList.push({
                        url: imageReaponse.reason.meta.url,
                        basename: imageReaponse.reason.meta.basename
                    })
                    writeFileSync(basePath + '/retry_twitter_monitor_media_failed_list.json', JSON.stringify(getMediaFailedList))
                    statusCount.error++
                    Log(false, 'log', `archiver: image ${imageReaponse.reason.meta.url}\tsuccess: ${statusCount.success}, error: ${statusCount.error}, ${statusCount.success + statusCount.error} / ${mediaList.length}`)
                }
            })
        })
        .catch((e) => {
            Log(false, 'log', e)
        })
    mediaIndex += 100
    writeFileSync(basePath + '/retry_twitter_monitor_media_index', String(mediaIndex))
}

process.exit()
