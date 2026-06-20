[33mcommit 00f62e61944c2a0c7313002d8931c984b0629325[m
Author: Mohd16kaif <kaif39882@gmail.com>
Date:   Tue Jun 16 21:29:24 2026 +0530

    42

[1mdiff --git a/ios/reclaimapp/FamilyControlsBridge.swift b/ios/reclaimapp/FamilyControlsBridge.swift[m
[1mindex d765c48..e84679b 100644[m
[1m--- a/ios/reclaimapp/FamilyControlsBridge.swift[m
[1m+++ b/ios/reclaimapp/FamilyControlsBridge.swift[m
[36m@@ -257,7 +257,82 @@[m [mclass FamilyControlsBridge: NSObject {[m
       let sharedDefaults = UserDefaults(suiteName: "group.com.reclaim.recovery")[m
 [m
       // Apply the filter immediately — do not wait for schedule[m
[31m-      store.webContent.blockedByFilter = .auto()[m
[32m+[m[32m      store.webContent.blockedByFilter = .auto([[m
[32m+[m[32m          // Sites Apple's classifier misses — manually enforced[m
[32m+[m[32m          "xhamster.com", "xhamster.desi", "xhamster.one",[m
[32m+[m[32m          "xvideos.com", "xvideos.es", "xvideos.red",[m
[32m+[m[32m          "xnxx.com", "xnxx.net",[m
[32m+[m[32m          "pornhub.com", "pornhub.org",[m
[32m+[m[32m          "redtube.com", "redtube.com.br",[m
[32m+[m[32m          "youporn.com",[m
[32m+[m[32m          "tube8.com",[m
[32m+[m[32m          "spankbang.com", "spankbang.party",[m
[32m+[m[32m          "eporner.com",[m
[32m+[m[32m          "beeg.com",[m
[32m+[m[32m          "tnaflix.com",[m
[32m+[m[32m          "drtuber.com",[m
[32m+[m[32m          "nuvid.com",[m
[32m+[m[32m          "porntrex.com",[m
[32m+[m[32m          "empflix.com",[m
[32m+[m[32m          "faphouse.com",[m
[32m+[m[32m          "hentaihaven.xxx",[m
[32m+[m[32m          "nhentai.net", "nhentai.to",[m
[32m+[m[32m          "rule34.xxx", "rule34.paheal.net",[m
[32m+[m[32m          "gelbooru.com",[m
[32m+[m[32m          "danbooru.donmai.us",[m
[32m+[m[32m          "motherless.com",[m
[32m+[m[32m          "thisvid.com",[m
[32m+[m[32m          "gaytube.com",[m
[32m+[m[32m          "porndig.com",[m
[32m+[m[32m          "pornone.com",[m
[32m+[m[32m          "4tube.com",[m
[32m+[m[32m          "fux.com",[m
[32m+[m[32m          "porngo.com",[m
[32m+[m[32m          "hdporn.net",[m
[32m+[m[32m          "sexvid.xxx",[m
[32m+[m[32m          "fuq.com",[m
[32m+[m[32m          "cliphunter.com",[m
[32m+[m[32m          "pornhd.com",[m
[32m+[m[32m          "helixstudios.net",[m
[32m+[m[32m          "brazzers.com",[m
[32m+[m[32m          "bangbros.com",[m
[32m+[m[32m          "realitykings.com",[m
[32m+[m[32m          "mofos.com",[m
[32m+[m[32m          "naughtyamerica.com",[m
[32m+[m[32m          "digitalplayground.com",[m
[32m+[m[32m          "fakehub.com",[m
[32m+[m[32m          "wankz.com",[m
[32m+[m[32m          "xtube.com",[m
[32m+[m[32m          "gaymaletube.com",[m
[32m+[m[32m          "ashemaletube.com",[m
[32m+[m[32m          "trannytube.tv",[m
[32m+[m[32m          "hclips.com",[m
[32m+[m[32m          "hardsextube.com",[m
[32m+[m[32m          "pornrabbit.com",[m
[32m+[m[32m          "pornktube.com",[m
[32m+[m[32m          "porndoe.com",[m
[32m+[m[32m          "zbporn.com",[m
[32m+[m[32m          "vporn.com",[m
[32m+[m[32m          "hdtube.porn",[m
[32m+[m[32m          "pornoxo.com",[m
[32m+[m[32m          "pornstars.com",[m
[32m+[m[32m          "babes.com",[m
[32m+[m[32m          "maturetubehere.com",[m
[32m+[m[32m          "milf.com",[m
[32m+[m[32m          "xmilf.com",[m
[32m+[m[32m          "bravotube.net",[m
[32m+[m[32m          "fapvid.com",[m
[32m+[m[32m          "pornheed.com",[m
[32m+[m[32m          "txxx.com",[m
[32m+[m[32m          "tubepornclassic.com",[m
[32m+[m[32m          "watchmygf.me",[m
[32m+[m[32m          "homemoviestube.com",[m
[32m+[m[32m          "eroprofile.com",[m
[32m+[m[32m          "imagefap.com",[m
[32m+[m[32m          "sex.com",[m
[32m+[m[32m          "reddit.com/r/nsfw",[m
[32m+[m[32m          "reddit.com/r/gonewild"[m
[32m+[m[32m      ])[m
       NSLog("FamilyControlsBridge: Adult content filter enabled")[m
 [m
       // Handle permanent block (days == 0 means forever)[m
