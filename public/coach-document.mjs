import {validateCoachSummary} from './coach-model.mjs';
import {validDay} from './progress-model.mjs';

// Report content is data: only these simple text structures receive formatting.
// Raw HTML is never evaluated, and exporting never asks the AI to rewrite it.
export function reportBlocks(text) {
  return text.replace(/\r\n?/g,'\n').split('\n').flatMap(line=>{
    const value=line.trim();
    if(!value)return [];
    if(/^[-*_]{3,}$/.test(value))return [{kind:'rule',text:''}];
    const markdown=value.match(/^#{1,6}\s+(.+)$/);
    const numbered=/^(?:[一二三四五六七八九十]+[、．.]|[1-9]\d?[.、．)]|[（(][一二三四五六七八九十\d]+[）)])\s*/;
    const plain=value.replace(/^\*\*(.+)\*\*$/,'$1');
    if(markdown)return [{kind:markdown[1].length<=120?'heading':'paragraph',text:markdown[1]}];
    if(plain.length<=48&&!/[。；！？]$/.test(plain)&&
      (numbered.test(plain)||/^(本阶段概况|可验证的进步|优先解决|未来一周|数据局限)/.test(plain)))
      return [{kind:'heading',text:plain}];
    if(/^[-*+]\s+/.test(value))return [{kind:'list',text:value.replace(/^[-*+]\s+/,'')}];
    if(/^>\s?/.test(value))return [{kind:'quote',text:value.replace(/^>\s?/,'')}];
    return [{kind:'paragraph',text:value}];
  });
}

export function inlineRuns(text) {
  return text.split(/(\*\*[^*\n]+\*\*|`[^`\n]+`)/g).filter(Boolean).map(value=>
    value.startsWith('**')&&value.endsWith('**')?{text:value.slice(2,-2),bold:true}:
    value.startsWith('`')&&value.endsWith('`')?{text:value.slice(1,-1),bold:false}:{text:value,bold:false});
}

export function coachDocument(report) {
  if(!report||typeof report.text!=='string'||!report.text.trim()||report.text.length>30000)
    throw Error('报告正文为空或过长，无法导出 PDF。');
  if(![7,30].includes(report.period?.days)||!validDay(report.period.start)||!validDay(report.period.end))
    throw Error('报告日期无效，无法导出 PDF。');
  let evidence=null;
  try {
    const candidate=validateCoachSummary(report.evidence);
    if(['days','start','end'].every(k=>candidate.period[k]===report.period[k]))evidence=candidate;
  }catch{/* Older saved reports can still export their original text. */}
  const date=new Date(report.generatedAt);
  return {
    title:`近 ${report.period.days} 天练琴报告`,period:{...report.period},
    generatedAt:Number.isNaN(date.getTime())?'生成时间未记录':date.toLocaleString('zh-CN',{hour12:false}),
    model:typeof report.model==='string'?report.model.slice(0,80):'AI 阶段点评',
    blocks:reportBlocks(report.text),evidence,
    filename:`Banpai-AI-${report.period.end}-${report.period.days}days.pdf`
  };
}
