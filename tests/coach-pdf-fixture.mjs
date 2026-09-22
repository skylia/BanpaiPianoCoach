// Synthetic data only. Shared by PDF layout checks and the isolated browser QA.
export function coachPdfFixture(days=7) {
  const period={days,start:days===7?'2026-09-16':'2026-08-24',end:'2026-09-22'};
  const stats={minutes:126,captureMinutes:106,manualMinutes:20,practiceDays:6,sessions:18,midiSessions:14,virtualSessions:3,incompleteSessions:2,pitch:94,rhythm:86,follow:{sessions:5,errorAttempts:13,correctionSeconds:42,firstPass:82,rhythm:78}};
  const attempt={date:period.end,pitch:96,rhythm:89,firstPass:null};
  const evidence={schemaVersion:1,period,targetGrade:3,weeklyMinutes:180,current:stats,previous:{...stats,minutes:98,captureMinutes:88,manualMinutes:10,practiceDays:5,sessions:14,pitch:91,rhythm:80,follow:{sessions:0,errorAttempts:0,correctionSeconds:0,firstPass:null,rhythm:null}},pieces:[
    {title:'克列门蒂 · C 大调小奏鸣曲 Op.36 No.1 · 第一乐章',source:'midi',practiceMode:'fixed',errorAttempts:0,hand:'both',startBar:1,endBar:8,bpm:72,attempts:7,complete:6,minutes:42,first:{...attempt,pitch:89,rhythm:81},last:attempt},
    {title:'克列门蒂 · C 大调小奏鸣曲 Op.36 No.1 · 第二乐章',source:'midi',practiceMode:'follow',errorAttempts:13,hand:'both',startBar:1,endBar:8,bpm:56,attempts:5,complete:4,minutes:34,first:{...attempt,pitch:null,firstPass:75,rhythm:74},last:{...attempt,pitch:null,firstPass:88,rhythm:82}},
    {title:'克列门蒂 · C 大调小奏鸣曲 Op.36 No.1 · 第三乐章',source:'virtual',practiceMode:'fixed',errorAttempts:0,hand:'right',startBar:9,endBar:16,bpm:84,attempts:3,complete:3,minutes:22,first:attempt,last:attempt}
  ],hotspots:[{title:'第一乐章',practiceMode:'fixed',bar:4,hand:'both',issues:5}],evidence:{detailedCompleteTakes:12,captureSessions:17,invalidRecords:0,limitations:['模拟练习已排除；补记只代表投入时长。','整体准确率变化可能来自曲目或速度变化，不能直接等同于能力升降。','详细音符只保留最近 100 遍，热点仅覆盖仍有明细的完整练习。','未采集手型、手指、踏板、原始音频或音乐表现力。','跟弹与固定速度分组：跟弹首次通过率、首次起音节奏和纠错次数单列。']},plans:[],checklist:{done:3,review:2}};
  return {period,model:'排版测试 · 模拟报告',generatedAt:'2026-09-22T12:30:00Z',evidence,text:`一、本阶段概况
这份报告使用模拟数据，用于检查 PDF 的阅读效果。本期在 ${days} 天里记录了 6 个练习日，共 126 分钟，其中自动采集 106 分钟、手动补记 20 分钟。你把时间分配给了克列门蒂《C 大调小奏鸣曲 Op.36 No.1》的三个乐章，既有分段巩固，也有不同模式的尝试。
练习分布比一次性长时间练习更值得关注。接下来可以继续保留短时、明确目标的安排，每次先处理一个问题，再把它放回完整乐句中验证。

二、可验证的进步
第一乐章第 1-8 小节，在双手、72 BPM 的同组完整记录中，音符准确率从 89% 到 96%，起音合拍率从 81% 到 89%。这些变化说明这段内容在相同条件下有改善；暂时不要把它推广为整首曲子或整个等级的能力变化。
第二乐章采用跟弹模式，最近完整一遍的首次通过率为 88%。跟弹有助于确认音符与和弦，但弹对后才继续的机制，会把最终完成率推高，因此应当一起看首次通过率、节奏表现和重试次数。

三、优先解决的问题
- **第一乐章第 4 小节**：现有完整明细中出现了 5 次问题标记。先放慢速度，确认起音位置，再检查它与前后小节的连接；仅凭标记还不能确定问题来自哪个手指。
- **第二乐章的连续性**：本期跟弹共记录 13 次错误尝试，纠错等待约 42 秒。下一轮可以缩短练习范围，先稳定一个乐句，逐渐减少停下来重新找音的次数。
- 第三乐章的记录来自屏幕琴键、右手练习。它可作为读谱参考，暂时不与实琴双手结果直接比较。

四、未来一周的具体练习安排
第 1-2 天：第一乐章第 1-8 小节，以 72 BPM 复习，每轮只给自己一个目标。先确认第 4 小节，再从第 3 小节连到第 5 小节，最后回到完整范围。建议每次 15 分钟，结束时记录最容易出错的位置。
第 3-4 天：第二乐章第 1-8 小节，以 56 BPM 的跟弹模式练习。先看清和弦，再让双手同时落下；每完成一轮，观察错误尝试次数与首次起音合拍率，不急着提高速度。
第 5-6 天：将已练片段放回固定速度模式。可以先做一次完整采集，再有针对性地修正。只有在音符与起音都比较稳定时，才考虑小幅加速，并把新速度作为新的比较条件。
第 7 天：整理这一周的发现。保留一遍完整记录，写下一个已经改善的细节和一个仍待解决的问题，把需要实际听辨的强弱、音色与乐句处理留给本人或老师复核。

五、数据局限
这些建议依据练习摘要与仍保留的明细生成，不能替代实际聆听。补记只说明投入了时间；没有详细记录的位置，不代表一定没有错误。音色、踏板、手型和音乐表现力未被采集，报告也不据此判断已经达到某个考级等级。`};
}
