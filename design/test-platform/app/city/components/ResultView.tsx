'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Download, Share2, Sparkles, MapPin } from 'lucide-react';
import { useQuizStore } from '../lib/store/useQuizStore';
import { useRouter } from 'next/navigation';
import OrderOverlay from './OrderOverlay';
import { toPng } from 'html-to-image';
import { Turnstile } from '@marsidev/react-turnstile';
import { 
  generateCityQrCodeSvg, 
  buildCityShareUrl, 
  generateCityShareCopy, 
  copyImageAndTextToClipboard, 
  syncCopyText, 
  isMobileDevice, 
  isWeChatEnvironment 
} from '../utils/share';

// 16 座城市灵魂专属量身定制车票皮肤系统（底色、文字、边框、钢印、图谱与背景渐变深度契合城市本身）
const DEFAULT_FALLBACK_THEME = {
  pinyin: 'aletai',
  sanctuary: '旷野山海 · 灵魂避难所',
  badgeText: '[ SOUL TICKET ARCHIVE ]',
  bg: 'bg-[#fdfbf7]',
  text: 'text-[#1a1a1a]',
  border: 'border-[#d1cdc1]',
  cardBorder: 'border-2 border-[#d1cdc1]',
  divider: 'border-[#b5b1a3]',
  tearStyle: 'border-t-2 border-dashed border-[#b5b1a3]',
  stampBorder: 'border-red-600 text-red-600 bg-red-500/5',
  stampTitle: '灵魂归属',
  stampSub: '已检票/PASS',
  tagBg: 'bg-[#1a1a1a] text-[#fdfbf7]',
  barFill: 'bg-[#1a1a1a]',
  barTrack: 'bg-[#e4dfd4] border-[#1a1a1a]/15',
  quoteBg: 'bg-black/5 border-black',
  labelBg: 'bg-black/10 text-black',
  btnBg: 'bg-[#1a1a1a] text-white hover:bg-black',
  taglineColor: 'border-black',
  serialPrefix: 'CN-34-SOUL-EXPRESS',
  headerBg: 'bg-[#13171e]',
  headerText: 'text-white',
  bannerOverlay: 'bg-gradient-to-r from-[#13171e] via-[#13171e]/85 via-45% to-transparent',
  tagBgHeader: 'bg-white/20 text-white backdrop-blur-md border border-white/25',
  sanctuaryBadge: 'bg-black/60 text-amber-300 border border-amber-400/40 backdrop-blur-xs'
};

const CITY_THEMES: Record<string, typeof DEFAULT_FALLBACK_THEME> = {
  "阿勒泰": {
    pinyin: 'aletai',
    sanctuary: '禾木夏牧场 · 旷野雪山',
    badgeText: '[ ALTAY WILDERNESS EXPEDITION ]',
    bg: 'bg-[#f7faf8]',
    text: 'text-[#162a1f]',
    border: 'border-[#8ea696]',
    cardBorder: 'border-2 border-[#8ea696]',
    divider: 'border-[#8ea696]/60',
    tearStyle: 'border-t-2 border-dashed border-[#8ea696]',
    stampBorder: 'border-[#2e7d32] text-[#2e7d32] bg-[#2e7d32]/10',
    stampTitle: '极致旷野',
    stampSub: 'ALTAY·PASS',
    tagBg: 'bg-[#1b382b] text-white',
    barFill: 'bg-[#2e7d32]',
    barTrack: 'bg-[#e2ede5] border-[#2e7d32]/20',
    quoteBg: 'bg-[#2e7d32]/10 border-[#2e7d32]',
    labelBg: 'bg-[#2e7d32]/15 text-[#162a1f]',
    btnBg: 'bg-[#1b382b] text-white hover:bg-[#142c21]',
    taglineColor: 'border-[#2e7d32]/30',
    serialPrefix: 'ALTAY-WILD-0906-PASS',
    headerBg: 'bg-[#0e1e18]',
    headerText: 'text-[#e8f5e9]',
    bannerOverlay: 'bg-gradient-to-r from-[#0e1e18] via-[#0e1e18]/85 via-45% to-transparent',
    tagBgHeader: 'bg-white/20 text-white backdrop-blur-md border border-white/25',
    sanctuaryBadge: 'bg-black/60 text-emerald-300 border border-emerald-400/40 backdrop-blur-xs'
  },
  "深圳": {
    pinyin: 'shenzhen',
    sanctuary: '南山云端 · 赛博极客',
    badgeText: '// SYSTEM: SHENZHEN GEEK 0x755 //',
    bg: 'bg-[#0d1219]',
    text: 'text-[#00FF66]',
    border: 'border-[#00FF66]/50',
    cardBorder: 'border-2 border-[#00FF66] shadow-[0_0_25px_rgba(0,255,102,0.15)]',
    divider: 'border-[#00FF66]/40',
    tearStyle: 'border-t-2 border-dotted border-[#00FF66]',
    stampBorder: 'border-[#00FF66] text-[#00FF66] bg-[#00FF66]/10 shadow-[0_0_15px_rgba(0,255,102,0.3)]',
    stampTitle: '破壁进化',
    stampSub: 'SZ·CYBER',
    tagBg: 'bg-[#00FF66] text-[#0d1219] font-black',
    barFill: 'bg-[#00FF66]',
    barTrack: 'bg-[#14261c] border-[#00FF66]/30',
    quoteBg: 'bg-[#00FF66]/10 border-[#00FF66] text-[#00FF66]',
    labelBg: 'bg-[#00FF66]/20 text-[#00FF66]',
    btnBg: 'bg-[#00FF66] text-black hover:bg-[#00e65c] font-black',
    taglineColor: 'border-[#00FF66]/30',
    serialPrefix: 'HEX:0x755-SPEEDRUN',
    headerBg: 'bg-[#080e18]',
    headerText: 'text-[#00FF66]',
    bannerOverlay: 'bg-gradient-to-r from-[#080e18] via-[#080e18]/85 via-45% to-transparent',
    tagBgHeader: 'bg-[#00FF66]/20 text-[#00FF66] backdrop-blur-md border border-[#00FF66]/50 shadow-[0_0_10px_rgba(0,255,102,0.2)]',
    sanctuaryBadge: 'bg-black/70 text-[#00FF66] border border-[#00FF66]/60 backdrop-blur-xs shadow-[0_0_10px_rgba(0,255,102,0.3)]'
  },
  "武汉": {
    pinyin: 'wuhan',
    sanctuary: '武大樱顶 · 江城过早',
    badgeText: '[ WUHAN SAKURA & REGANMIAN ]',
    bg: 'bg-[#fff8f9]',
    text: 'text-[#2b191e]',
    border: 'border-[#f472b6]/40',
    cardBorder: 'border-2 border-[#f472b6]/50',
    divider: 'border-[#f472b6]/40',
    tearStyle: 'border-t-2 border-dashed border-[#f472b6]/70',
    stampBorder: 'border-[#e11d48] text-[#e11d48] bg-[#e11d48]/10',
    stampTitle: '江汉弄潮',
    stampSub: 'WH·SAKURA',
    tagBg: 'bg-[#be123c] text-white',
    barFill: 'bg-[#e11d48]',
    barTrack: 'bg-[#fce7ed] border-[#e11d48]/20',
    quoteBg: 'bg-[#e11d48]/10 border-[#e11d48]',
    labelBg: 'bg-[#e11d48]/15 text-[#2b191e]',
    btnBg: 'bg-[#be123c] text-white hover:bg-[#9f1239]',
    taglineColor: 'border-[#e11d48]/30',
    serialPrefix: 'WH-027-SAKURA-PASS',
    headerBg: 'bg-[#181316]',
    headerText: 'text-[#fff0f5]',
    bannerOverlay: 'bg-gradient-to-r from-[#181316] via-[#181316]/85 via-45% to-transparent',
    tagBgHeader: 'bg-[#e11d48]/30 text-white backdrop-blur-md border border-[#e11d48]/40',
    sanctuaryBadge: 'bg-black/60 text-rose-300 border border-rose-400/40 backdrop-blur-xs'
  },
  "上海": {
    pinyin: 'shanghai',
    sanctuary: '外滩露台 · 摩登天际',
    badgeText: '[ METROPOLIS ORDER & BORDER ]',
    bg: 'bg-[#f8fafc]',
    text: 'text-[#0f172a]',
    border: 'border-[#94a3b8]',
    cardBorder: 'border-2 border-[#94a3b8]',
    divider: 'border-[#cbd5e1]',
    tearStyle: 'border-t-2 border-dashed border-[#94a3b8]',
    stampBorder: 'border-[#4f46e5] text-[#4f46e5] bg-[#4f46e5]/10',
    stampTitle: '摩登秩序',
    stampSub: 'SH·METRO',
    tagBg: 'bg-[#1e1b4b] text-white',
    barFill: 'bg-[#4f46e5]',
    barTrack: 'bg-[#e2e8f0] border-[#4f46e5]/20',
    quoteBg: 'bg-[#4f46e5]/10 border-[#4f46e5]',
    labelBg: 'bg-[#4f46e5]/15 text-[#0f172a]',
    btnBg: 'bg-[#1e1b4b] text-white hover:bg-black',
    taglineColor: 'border-[#4f46e5]/30',
    serialPrefix: 'SH-021-METROSOUL',
    headerBg: 'bg-[#0e1522]',
    headerText: 'text-[#f8fafc]',
    bannerOverlay: 'bg-gradient-to-r from-[#0e1522] via-[#0e1522]/85 via-45% to-transparent',
    tagBgHeader: 'bg-white/20 text-white backdrop-blur-md border border-white/25',
    sanctuaryBadge: 'bg-black/60 text-indigo-300 border border-indigo-400/40 backdrop-blur-xs'
  },
  "长沙": {
    pinyin: 'changsha',
    sanctuary: '橘洲江岸 · 不夜星城',
    badgeText: '★ CHANGSHA NIGHTLESS FEAST ★',
    bg: 'bg-[#fff7ed]',
    text: 'text-[#2e150f]',
    border: 'border-[#ea580c]',
    cardBorder: 'border-2 border-[#ea580c]',
    divider: 'border-[#ea580c]/40',
    tearStyle: 'border-t-2 border-dashed border-[#ea580c]',
    stampBorder: 'border-[#ea580c] text-[#ea580c] bg-[#ea580c]/10',
    stampTitle: '高燃尽兴',
    stampSub: 'CS·FIRE',
    tagBg: 'bg-[#9a3412] text-[#fff7ed]',
    barFill: 'bg-[#ea580c]',
    barTrack: 'bg-[#ffedd5] border-[#ea580c]/20',
    quoteBg: 'bg-[#ea580c]/10 border-[#ea580c]',
    labelBg: 'bg-[#ea580c]/15 text-[#2e150f]',
    btnBg: 'bg-[#ea580c] text-white hover:bg-[#c2410c]',
    taglineColor: 'border-[#ea580c]/30',
    serialPrefix: 'CS-0731-NIGHTPASS',
    headerBg: 'bg-[#1e1116]',
    headerText: 'text-[#fed7aa]',
    bannerOverlay: 'bg-gradient-to-r from-[#1e1116] via-[#1e1116]/85 via-45% to-transparent',
    tagBgHeader: 'bg-[#ea580c]/30 text-[#fff7ed] backdrop-blur-md border border-[#ea580c]/50',
    sanctuaryBadge: 'bg-[#24120e]/80 text-amber-300 border border-amber-400/40 backdrop-blur-xs'
  },
  "大理": {
    pinyin: 'dali',
    sanctuary: '龙龛码头 · 苍洱晨曦',
    badgeText: '[ ERHAI LAKE DRIFTING PASS ]',
    bg: 'bg-[#f8fafc]',
    text: 'text-[#0f243a]',
    border: 'border-[#38bdf8]',
    cardBorder: 'border-2 border-[#0284c7]',
    divider: 'border-[#38bdf8]/50',
    tearStyle: 'border-t-2 border-dashed border-[#0284c7]',
    stampBorder: 'border-[#0284c7] text-[#0284c7] bg-[#0284c7]/10',
    stampTitle: '苍洱漫游',
    stampSub: 'DALI·WIND',
    tagBg: 'bg-[#0369a1] text-white',
    barFill: 'bg-[#0284c7]',
    barTrack: 'bg-[#e0f2fe] border-[#0284c7]/20',
    quoteBg: 'bg-[#0284c7]/10 border-[#0284c7]',
    labelBg: 'bg-[#0284c7]/15 text-[#0f243a]',
    btnBg: 'bg-[#0369a1] text-white hover:bg-[#075985]',
    taglineColor: 'border-[#0284c7]/30',
    serialPrefix: 'DL-0872-SLOWRUN',
    headerBg: 'bg-[#0c1a2e]',
    headerText: 'text-[#e0f2fe]',
    bannerOverlay: 'bg-gradient-to-r from-[#0c1a2e] via-[#0c1a2e]/85 via-45% to-transparent',
    tagBgHeader: 'bg-[#0284c7]/25 text-white backdrop-blur-md border border-[#0284c7]/40',
    sanctuaryBadge: 'bg-black/60 text-sky-300 border border-sky-400/40 backdrop-blur-xs'
  },
  "成都": {
    pinyin: 'chengdu',
    sanctuary: '鹤鸣茶社 · 银杏竹椅',
    badgeText: '[ CHENGDU BAMBOO TEA RETREAT ]',
    bg: 'bg-[#fdfbf7]',
    text: 'text-[#2d2118]',
    border: 'border-[#d6c7b2]',
    cardBorder: 'border-2 border-[#b45309]/60',
    divider: 'border-[#d6c7b2]',
    tearStyle: 'border-t-2 border-dashed border-[#b45309]',
    stampBorder: 'border-[#b45309] text-[#b45309] bg-[#b45309]/10',
    stampTitle: '巴适自洽',
    stampSub: 'CD·EASY',
    tagBg: 'bg-[#78350f] text-white',
    barFill: 'bg-[#b45309]',
    barTrack: 'bg-[#fef3c7] border-[#b45309]/20',
    quoteBg: 'bg-[#b45309]/10 border-[#b45309]',
    labelBg: 'bg-[#b45309]/15 text-[#2d2118]',
    btnBg: 'bg-[#78350f] text-white hover:bg-[#451a03]',
    taglineColor: 'border-[#b45309]/30',
    serialPrefix: 'CD-028-LAZYSOUL',
    headerBg: 'bg-[#1c1410]',
    headerText: 'text-[#fdfbf7]',
    bannerOverlay: 'bg-gradient-to-r from-[#1c1410] via-[#1c1410]/85 via-45% to-transparent',
    tagBgHeader: 'bg-white/20 text-white backdrop-blur-md border border-white/25',
    sanctuaryBadge: 'bg-black/60 text-amber-300 border border-amber-400/40 backdrop-blur-xs'
  },
  "北京": {
    pinyin: 'beijing',
    sanctuary: '景山万春 · 故宫雪霁',
    badgeText: '[ BEIJING IMPERIAL HERITAGE ]',
    bg: 'bg-[#fdfbf7]',
    text: 'text-[#1c1618]',
    border: 'border-[#dc2626]/40',
    cardBorder: 'border-2 border-[#b91c1c]',
    divider: 'border-[#dc2626]/30',
    tearStyle: 'border-t-2 border-dashed border-[#b91c1c]',
    stampBorder: 'border-[#b91c1c] text-[#b91c1c] bg-[#b91c1c]/10',
    stampTitle: '宏大风骨',
    stampSub: 'BJ·CAPITAL',
    tagBg: 'bg-[#991b1b] text-white',
    barFill: 'bg-[#dc2626]',
    barTrack: 'bg-[#fee2e2] border-[#dc2626]/20',
    quoteBg: 'bg-[#dc2626]/10 border-[#dc2626]',
    labelBg: 'bg-[#dc2626]/15 text-[#1c1618]',
    btnBg: 'bg-[#991b1b] text-white hover:bg-[#7f1d1d]',
    taglineColor: 'border-[#dc2626]/30',
    serialPrefix: 'BJ-010-CAPITALPASS',
    headerBg: 'bg-[#141923]',
    headerText: 'text-[#fdfbf7]',
    bannerOverlay: 'bg-gradient-to-r from-[#141923] via-[#141923]/85 via-45% to-transparent',
    tagBgHeader: 'bg-[#dc2626]/30 text-white backdrop-blur-md border border-[#dc2626]/40',
    sanctuaryBadge: 'bg-black/60 text-rose-300 border border-rose-400/40 backdrop-blur-xs'
  },
  "杭州": {
    pinyin: 'hangzhou',
    sanctuary: '茅家水榭 · 龙井茶园',
    badgeText: '[ WEST LAKE RETREAT ARCHIVE ]',
    bg: 'bg-[#f6faf8]',
    text: 'text-[#152420]',
    border: 'border-[#0d9488]/40',
    cardBorder: 'border-2 border-[#0d9488]',
    divider: 'border-[#0d9488]/30',
    tearStyle: 'border-t-2 border-dashed border-[#0d9488]',
    stampBorder: 'border-[#0d9488] text-[#0d9488] bg-[#0d9488]/10',
    stampTitle: '宋韵隐逸',
    stampSub: 'HZ·ZEN',
    tagBg: 'bg-[#115e59] text-white',
    barFill: 'bg-[#0d9488]',
    barTrack: 'bg-[#ccfbf1] border-[#0d9488]/20',
    quoteBg: 'bg-[#0d9488]/10 border-[#0d9488]',
    labelBg: 'bg-[#0d9488]/15 text-[#152420]',
    btnBg: 'bg-[#115e59] text-white hover:bg-[#134e4a]',
    taglineColor: 'border-[#0d9488]/30',
    serialPrefix: 'HZ-0571-ZENPASS',
    headerBg: 'bg-[#121e1c]',
    headerText: 'text-[#e6f4ee]',
    bannerOverlay: 'bg-gradient-to-r from-[#121e1c] via-[#121e1c]/85 via-45% to-transparent',
    tagBgHeader: 'bg-[#0d9488]/25 text-white backdrop-blur-md border border-[#0d9488]/40',
    sanctuaryBadge: 'bg-black/60 text-teal-300 border border-teal-400/40 backdrop-blur-xs'
  },
  "苏州": {
    pinyin: 'suzhou',
    sanctuary: '艺圃漏窗 · 芭蕉听雨',
    badgeText: '[ CLASSICAL SUZHOU PAVILION ]',
    bg: 'bg-[#f8f9fa]',
    text: 'text-[#1a1d20]',
    border: 'border-[#64748b]/40',
    cardBorder: 'border-2 border-[#475569]',
    divider: 'border-[#cbd5e1]',
    tearStyle: 'border-t-2 border-dashed border-[#475569]',
    stampBorder: 'border-[#475569] text-[#475569] bg-[#475569]/10',
    stampTitle: '姑苏留白',
    stampSub: 'SZ·POET',
    tagBg: 'bg-[#1e293b] text-white',
    barFill: 'bg-[#475569]',
    barTrack: 'bg-[#f1f5f9] border-[#475569]/20',
    quoteBg: 'bg-[#475569]/10 border-[#475569]',
    labelBg: 'bg-[#475569]/15 text-[#1a1d20]',
    btnBg: 'bg-[#1e293b] text-white hover:bg-black',
    taglineColor: 'border-[#475569]/30',
    serialPrefix: 'SZ-0512-INKSOUL',
    headerBg: 'bg-[#15181c]',
    headerText: 'text-[#f3f4f6]',
    bannerOverlay: 'bg-gradient-to-r from-[#15181c] via-[#15181c]/85 via-45% to-transparent',
    tagBgHeader: 'bg-white/15 text-white backdrop-blur-md border border-white/20',
    sanctuaryBadge: 'bg-black/70 text-slate-300 border border-slate-400/40 backdrop-blur-xs font-mono'
  },
  "青岛": {
    pinyin: 'qingdao',
    sanctuary: '燕儿悬崖 · 山海微醺',
    badgeText: '[ QINGDAO COASTAL SANCTUARY ]',
    bg: 'bg-[#f0f9ff]',
    text: 'text-[#0c243c]',
    border: 'border-[#0284c7]/40',
    cardBorder: 'border-2 border-[#0284c7]',
    divider: 'border-[#7dd3fc]/60',
    tearStyle: 'border-t-2 border-dashed border-[#0284c7]',
    stampBorder: 'border-[#0284c7] text-[#0284c7] bg-[#0284c7]/10',
    stampTitle: '山海微醺',
    stampSub: 'QD·BEER',
    tagBg: 'bg-[#075985] text-white',
    barFill: 'bg-[#0284c7]',
    barTrack: 'bg-[#e0f2fe] border-[#0284c7]/20',
    quoteBg: 'bg-[#0284c7]/10 border-[#0284c7]',
    labelBg: 'bg-[#0284c7]/15 text-[#0c243c]',
    btnBg: 'bg-[#075985] text-white hover:bg-[#0c4a6e]',
    taglineColor: 'border-[#0284c7]/30',
    serialPrefix: 'QD-0532-OCEANPASS',
    headerBg: 'bg-[#0c1a2e]',
    headerText: 'text-[#bae6fd]',
    bannerOverlay: 'bg-gradient-to-r from-[#0c1a2e] via-[#0c1a2e]/85 via-45% to-transparent',
    tagBgHeader: 'bg-[#0284c7]/25 text-white backdrop-blur-md border border-[#0284c7]/40',
    sanctuaryBadge: 'bg-black/60 text-cyan-300 border border-cyan-400/40 backdrop-blur-xs'
  },
  "广州": {
    pinyin: 'guangzhou',
    sanctuary: '沙面古榕 · 珠江晚渡',
    badgeText: '[ CANTON LIVING HERITAGE ]',
    bg: 'bg-[#faf7f2]',
    text: 'text-[#281e19]',
    border: 'border-[#d4c5b9]',
    cardBorder: 'border-2 border-[#9a3412]/60',
    divider: 'border-[#d4c5b9]',
    tearStyle: 'border-t-2 border-dashed border-[#9a3412]',
    stampBorder: 'border-[#9a3412] text-[#9a3412] bg-[#9a3412]/10',
    stampTitle: '得闲饮茶',
    stampSub: 'GZ·DIMSUM',
    tagBg: 'bg-[#431407] text-white',
    barFill: 'bg-[#9a3412]',
    barTrack: 'bg-[#ffedd5] border-[#9a3412]/20',
    quoteBg: 'bg-[#9a3412]/10 border-[#9a3412]',
    labelBg: 'bg-[#9a3412]/15 text-[#281e19]',
    btnBg: 'bg-[#431407] text-white hover:bg-black',
    taglineColor: 'border-[#9a3412]/30',
    serialPrefix: 'GZ-020-DIMSUMPASS',
    headerBg: 'bg-[#141e18]',
    headerText: 'text-[#faf7f2]',
    bannerOverlay: 'bg-gradient-to-r from-[#141e18] via-[#141e18]/85 via-45% to-transparent',
    tagBgHeader: 'bg-white/20 text-white backdrop-blur-md border border-white/25',
    sanctuaryBadge: 'bg-black/60 text-amber-300 border border-amber-400/40 backdrop-blur-xs'
  },
  "重庆": {
    pinyin: 'chongqing',
    sanctuary: '白象花窗 · 索道江雾',
    badgeText: '// CHONGQING FOGGY VERTICAL CITY //',
    bg: 'bg-[#131518]',
    text: 'text-[#ff6e40]',
    border: 'border-[#ff5722]/50',
    cardBorder: 'border-2 border-[#ff5722] shadow-[0_0_20px_rgba(255,87,34,0.2)]',
    divider: 'border-[#ff5722]/40',
    tearStyle: 'border-t-2 border-dotted border-[#ff5722]',
    stampBorder: 'border-[#ff5722] text-[#ff5722] bg-[#ff5722]/15 shadow-[0_0_12px_rgba(255,87,34,0.3)]',
    stampTitle: '赛博江湖',
    stampSub: 'CQ·SPICY',
    tagBg: 'bg-[#ff5722] text-black font-black',
    barFill: 'bg-[#ff5722]',
    barTrack: 'bg-[#231a18] border-[#ff5722]/30',
    quoteBg: 'bg-[#ff5722]/10 border-[#ff5722] text-[#ff6e40]',
    labelBg: 'bg-[#ff5722]/20 text-[#ff6e40]',
    btnBg: 'bg-[#ff5722] text-black hover:bg-[#ff7043] font-black',
    taglineColor: 'border-[#ff5722]/30',
    serialPrefix: 'CQ-023-RIVERPASS',
    headerBg: 'bg-[#171a1e]',
    headerText: 'text-[#ff7043]',
    bannerOverlay: 'bg-gradient-to-r from-[#171a1e] via-[#171a1e]/85 via-45% to-transparent',
    tagBgHeader: 'bg-[#ff5722]/20 text-[#ff7043] backdrop-blur-md border border-[#ff5722]/40',
    sanctuaryBadge: 'bg-black/70 text-[#ff7043] border border-[#ff5722]/50 backdrop-blur-xs shadow-[0_0_10px_rgba(255,87,34,0.3)]'
  },
  "西安": {
    pinyin: 'xian',
    sanctuary: '明城垛口 · 盛唐夕照',
    badgeText: '[ CHANG\'AN ANCIENT WALL TICKET ]',
    bg: 'bg-[#faf6f0]',
    text: 'text-[#291f18]',
    border: 'border-[#cbb8a1]',
    cardBorder: 'border-2 border-[#92400e]/60',
    divider: 'border-[#cbb8a1]',
    tearStyle: 'border-t-2 border-dashed border-[#92400e]',
    stampBorder: 'border-[#92400e] text-[#92400e] bg-[#92400e]/10',
    stampTitle: '盛唐风骨',
    stampSub: 'XA·ANCIENT',
    tagBg: 'bg-[#451a03] text-white',
    barFill: 'bg-[#92400e]',
    barTrack: 'bg-[#fef3c7] border-[#92400e]/20',
    quoteBg: 'bg-[#92400e]/10 border-[#92400e]',
    labelBg: 'bg-[#92400e]/15 text-[#291f18]',
    btnBg: 'bg-[#451a03] text-white hover:bg-black',
    taglineColor: 'border-[#92400e]/30',
    serialPrefix: 'XA-029-WALLPASS',
    headerBg: 'bg-[#1d1714]',
    headerText: 'text-[#faf6f0]',
    bannerOverlay: 'bg-gradient-to-r from-[#1d1714] via-[#1d1714]/85 via-45% to-transparent',
    tagBgHeader: 'bg-white/20 text-white backdrop-blur-md border border-white/25',
    sanctuaryBadge: 'bg-black/60 text-amber-300 border border-amber-400/40 backdrop-blur-xs'
  },
  "三亚": {
    pinyin: 'sanya',
    sanctuary: '椰梦长廊 · 蔚蓝海潮',
    badgeText: '[ SANYA TROPICAL ESCAPE ]',
    bg: 'bg-[#f0fdfa]',
    text: 'text-[#0e353d]',
    border: 'border-[#5eead4]',
    cardBorder: 'border-2 border-[#0d9488]',
    divider: 'border-[#5eead4]/60',
    tearStyle: 'border-t-2 border-dashed border-[#0d9488]',
    stampBorder: 'border-[#0d9488] text-[#0d9488] bg-[#0d9488]/10',
    stampTitle: '海浪自愈',
    stampSub: 'SY·BEACH',
    tagBg: 'bg-[#134e4a] text-white',
    barFill: 'bg-[#0d9488]',
    barTrack: 'bg-[#ccfbf1] border-[#0d9488]/20',
    quoteBg: 'bg-[#0d9488]/10 border-[#0d9488]',
    labelBg: 'bg-[#0d9488]/15 text-[#0e353d]',
    btnBg: 'bg-[#134e4a] text-white hover:bg-[#042f2e]',
    taglineColor: 'border-[#0d9488]/30',
    serialPrefix: 'SY-0898-OCEANWAVE',
    headerBg: 'bg-[#0b1e24]',
    headerText: 'text-[#99f6e4]',
    bannerOverlay: 'bg-gradient-to-r from-[#0b1e24] via-[#0b1e24]/85 via-45% to-transparent',
    tagBgHeader: 'bg-[#0d9488]/25 text-white backdrop-blur-md border border-[#0d9488]/40',
    sanctuaryBadge: 'bg-black/60 text-teal-300 border border-teal-400/40 backdrop-blur-xs'
  },
  "厦门": {
    pinyin: 'xiamen',
    sanctuary: '鼓浪深巷 · 海风繁花',
    badgeText: '[ GULANGYU ISLAND PIANO PASS ]',
    bg: 'bg-[#fdf8f9]',
    text: 'text-[#28151d]',
    border: 'border-[#f472b6]/40',
    cardBorder: 'border-2 border-[#db2777]',
    divider: 'border-[#f472b6]/40',
    tearStyle: 'border-t-2 border-dashed border-[#db2777]',
    stampBorder: 'border-[#db2777] text-[#db2777] bg-[#db2777]/10',
    stampTitle: '海风温柔',
    stampSub: 'XM·ISLAND',
    tagBg: 'bg-[#831843] text-white',
    barFill: 'bg-[#db2777]',
    barTrack: 'bg-[#fce7f3] border-[#db2777]/20',
    quoteBg: 'bg-[#db2777]/10 border-[#db2777]',
    labelBg: 'bg-[#db2777]/15 text-[#28151d]',
    btnBg: 'bg-[#831843] text-white hover:bg-[#500724]',
    taglineColor: 'border-[#db2777]/30',
    serialPrefix: 'XM-0592-PIANOPASS',
    headerBg: 'bg-[#131b22]',
    headerText: 'text-[#fce7f3]',
    bannerOverlay: 'bg-gradient-to-r from-[#131b22] via-[#131b22]/85 via-45% to-transparent',
    tagBgHeader: 'bg-[#db2777]/25 text-white backdrop-blur-md border border-[#db2777]/40',
    sanctuaryBadge: 'bg-black/60 text-pink-300 border border-pink-400/40 backdrop-blur-xs'
  }
};

// 支持 ID 和城市名称的双向检索
const ID_TO_CITY_NAME: Record<string, string> = {
  "city_alt": "阿勒泰",
  "city_dl": "大理",
  "city_cd": "成都",
  "city_sh": "上海",
  "city_hz": "杭州",
  "city_szh": "苏州",
  "city_qd": "青岛",
  "city_gz": "广州",
  "city_cq": "重庆",
  "city_sz": "深圳",
  "city_cs": "长沙",
  "city_wh": "武汉",
  "city_xa": "西安",
  "city_sy": "三亚",
  "city_bj": "北京",
  "city_xm": "厦门"
};

function getCityTheme(city: any): typeof DEFAULT_FALLBACK_THEME {
  const name = city?.name || ID_TO_CITY_NAME[city?.id] || '';
  if (CITY_THEMES[name]) return CITY_THEMES[name];
  const id = city?.id ? String(city.id) : '';
  if (CITY_THEMES[ID_TO_CITY_NAME[id]]) return CITY_THEMES[ID_TO_CITY_NAME[id]];
  return DEFAULT_FALLBACK_THEME;
}

// 高精度误差函数逼近 (Abramowitz & Stegun 7.1.26)
function erf(x: number): number {
  const sign = x >= 0 ? 1 : -1;
  const a = Math.abs(x);
  const p = 0.3275911;
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const t = 1.0 / (1.0 + p * a);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-a * a);
  return sign * y;
}

// 16 座城市画像专属意境图腾
const CITY_TRAITS: Record<string, string> = {
  "深圳": "破壁进化力",
  "上海": "摩登秩序感",
  "北京": "宏大风骨度",
  "广州": "西关温润感",
  "成都": "巴适自洽力",
  "重庆": "赛博江湖力",
  "长沙": "高燃尽兴度",
  "武汉": "江汉弄潮力",
  "杭州": "宋韵隐逸度",
  "苏州": "姑苏留白美",
  "大理": "苍洱漫游力",
  "阿勒泰": "极致旷野力",
  "青岛": "山海微醺感",
  "厦门": "海风温柔度",
  "西安": "盛唐风骨度",
  "三亚": "热带自愈力"
};

// 50,000 次蒙特卡洛仿真校准的五维正态常模基准（左极统一避世/松弛/内敛，右极统一搞钱/繁华/进取）
const NORM_STATS = [
  { key: 'env',    coordIndex: 1, label: '环境', leftLabel: '精神阿勒泰', rightLabel: 'CBD工位',   mean: 0.058,  std: 4.366, positiveTrait: 'CBD工位冲刺力', negativeTrait: '精神阿勒泰感', invert: false },
  { key: 'rhythm', coordIndex: 0, label: '节奏', leftLabel: '精神退休',   rightLabel: '特种兵搞钱', mean: -0.135, std: 5.976, positiveTrait: '特种兵搞钱力', negativeTrait: '精神退休感',   invert: false },
  { key: 'social', coordIndex: 3, label: '社交', leftLabel: '极限纯i人', rightLabel: '社交悍匪e', mean: -0.043, std: 5.627, positiveTrait: '社交悍匪破圈力', negativeTrait: '极限纯i独修力', invert: false },
  { key: 'temp',   coordIndex: 2, label: '温度', leftLabel: '高冷淡人',   rightLabel: '话痨浓人',   mean: 0.023,  std: 5.235, positiveTrait: '话痨浓人热量', negativeTrait: '高冷淡人清醒', invert: false },
  { key: 'taste',  coordIndex: 4, label: '口腹', leftLabel: '极简白人饭', rightLabel: '重辣碳水狂', mean: -0.004, std: 5.330, positiveTrait: '重辣碳水狂欢欲', negativeTrait: '极简白人清修感', invert: false }
];

interface ResultViewProps {
  forcedResultData?: any;
  forcedUnlock?: boolean;
}

export default function ResultView({ forcedResultData, forcedUnlock }: ResultViewProps) {
  const router = useRouter();
  const { answers, deviceId, reset } = useQuizStore();
  const [resultData, setResultData] = useState<any>(forcedResultData || null);
  const [isUnlocked, setIsUnlocked] = useState(forcedUnlock ?? !!forcedResultData);
  const [unlockedData, setUnlockedData] = useState<any>(
    (forcedUnlock || forcedResultData?.city?.schedule) 
      ? (forcedResultData?.city || {}) 
      : null
  );
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [qrSvg, setQrSvg] = useState<string>('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const ticketRef = useRef<HTMLDivElement>(null);

  const lastCodeRef = useRef<string>('');
  const profilesRef = useRef<Record<string, any>>({});
  const [isSilentFetching, setIsSilentFetching] = useState(false);

  // 静默补齐新匹配城市的生活切片（方案 A：设备级免密丝滑通行）
  const silentFetchCityProfile = async (targetCityName: string, codeToUse?: string) => {
    if (isSilentFetching || !targetCityName) return;
    setIsSilentFetching(true);
    try {
      let did = deviceId;
      if (!did && typeof window !== 'undefined') {
        did = localStorage.getItem('deviceId') || '';
      }
      const res = await fetch('/api/city/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: codeToUse || lastCodeRef.current || 'CODE-JIE',
          deviceId: did || 'unknown',
          recordId: 'city-personality',
          cityName: targetCityName
        })
      });
      const data = await res.json();
      if (data.success && data.unlockedData) {
        setUnlockedData(data.unlockedData);
        setIsUnlocked(true);
        if (typeof window !== 'undefined') {
          profilesRef.current[targetCityName] = data.unlockedData;
          const updatedStorage = {
            unlocked: true,
            lastVerifiedCode: codeToUse || lastCodeRef.current || '',
            profiles: profilesRef.current,
            cityName: targetCityName,
            data: data.unlockedData
          };
          localStorage.setItem('verified_city-personality', JSON.stringify(updatedStorage));
        }
      }
    } catch (err) {
      console.error('城市测试静默补齐生活切片失败:', err);
    } finally {
      setIsSilentFetching(false);
    }
  };

  // 根据当前城市的文化与色彩特质，直接锁定该城市专属定制的车票皮肤主题
  const currentStyle = getCityTheme(resultData?.city);

  // 预生成纯前端矢量 SVG 二维码（零网络请求、零 CORS 污染）
  useEffect(() => {
    if (!resultData?.city) return;
    const shareUrl = buildCityShareUrl(resultData.city);
    if (shareUrl) {
      generateCityQrCodeSvg(shareUrl).then((svg) => {
        if (svg) setQrSvg(svg);
      });
    }
  }, [resultData?.city?.name, resultData?.city?.id]);

  useEffect(() => {
    // 强制清理历史废弃的旧版脏缓存
    if (typeof window !== 'undefined') {
      localStorage.removeItem('city-personality_unlocked');
      localStorage.removeItem('city-personality_unlocked_data');
      localStorage.removeItem('city-personality_saved_code');
    }

    async function fetchResult() {
      if (forcedResultData) {
        // preview 模式：若当前设备已解锁，自动匹配该城市 profiles 切片或静默补齐
        if (typeof window !== 'undefined' && forcedResultData.city?.name) {
          const currentCityName = forcedResultData.city.name;
          const cachedStr = localStorage.getItem('verified_city-personality');
          if (cachedStr) {
            try {
              const cached = JSON.parse(cachedStr);
              if (cached.unlocked) {
                setIsUnlocked(true);
                const savedCode = cached.lastVerifiedCode || '';
                const profiles = (cached.profiles && typeof cached.profiles === 'object') ? cached.profiles : {};
                if (cached.cityName && cached.data) profiles[cached.cityName] = cached.data;
                profilesRef.current = profiles;
                if (savedCode) lastCodeRef.current = savedCode;

                if (profiles[currentCityName]) {
                  setUnlockedData(profiles[currentCityName]);
                } else {
                  silentFetchCityProfile(currentCityName, savedCode);
                }
              }
            } catch (e) {}
          }
        }
        return;
      }
      try {
        let did = deviceId;
        if (!did) {
          did = crypto.randomUUID();
          useQuizStore.getState().setDeviceId(did);
        }

        const res = await fetch('/api/city/submit-test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers, deviceId: did })
        });
        const json = await res.json();
        if (json.success) {
          setResultData(json.data);

          // 方案 A：设备级解锁 + 多城市独立 profiles 字典缓存
          if (typeof window !== 'undefined' && json.data.city?.name) {
            const currentCityName = json.data.city.name;
            let deviceUnlocked = false;
            let savedCode = '';
            let localProfiles: Record<string, any> = {};

            const cachedStr = localStorage.getItem('verified_city-personality');
            if (cachedStr) {
              try {
                const cached = JSON.parse(cachedStr);
                if (cached.unlocked) {
                  deviceUnlocked = true;
                  savedCode = cached.lastVerifiedCode || '';
                  if (cached.profiles && typeof cached.profiles === 'object') {
                    localProfiles = { ...cached.profiles };
                  }
                  // 平滑兼容迁移旧版单城市结构
                  if (cached.cityName && cached.data) {
                    localProfiles[cached.cityName] = cached.data;
                  }
                }
              } catch (e) {
                if (cachedStr === 'true') {
                  deviceUnlocked = true;
                }
              }
            }

            if (savedCode) lastCodeRef.current = savedCode;
            profilesRef.current = localProfiles;

            if (deviceUnlocked) {
              setIsUnlocked(true);
              if (localProfiles[currentCityName]) {
                setUnlockedData(localProfiles[currentCityName]);
              } else {
                // 当前设备已激活，但本次测出新城市：先置空，自动静默补齐，免密通行！
                setUnlockedData(null);
                silentFetchCityProfile(currentCityName, savedCode);
              }
            } else {
              setIsUnlocked(false);
              setUnlockedData(null);
            }
          }
          
          // Save to history (only if not already the most recent record)
          try {
            const history = JSON.parse(localStorage.getItem('quiz_history_city') || '[]');
            const answersStr = JSON.stringify(answers);
            const isDuplicate = history.length > 0 && JSON.stringify(history[history.length - 1].answers) === answersStr;
            
            if (!isDuplicate) {
              const newId = Date.now().toString().slice(-6);
              history.push({ 
                id: newId, 
                answers, 
                timestamp: Date.now(),
                result: { title: json.data.city?.name || '性格城市匹配测试' }
              });
              localStorage.setItem('quiz_history_city', JSON.stringify(history));
            }
          } catch (e) {}
        } else {
          console.error('Submit failed:', json.error);
          // Fallback if API fails to prevent infinite loading
          setResultData({
            city: { name: '未知城市', title: '边界探索者', tags: ['神秘', '未知'], quote: '在迷雾中寻找真实的自我。' },
            rank: 9999,
            userCoords: [0, 0, 0, 0, 0]
          });
        }
      } catch (err) {
        console.error(err);
        // Fallback if network completely fails
        setResultData({
          city: { name: '断联之城', title: '信号游离者', tags: ['离线', '独立'], quote: '即使没有信号，列车依然前行。' },
          rank: 9999,
          userCoords: [0, 0, 0, 0, 0]
        });
      }
    }
    if (!forcedResultData) {
      fetchResult();
    }
  }, [answers, deviceId, forcedResultData]);

  if (!resultData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 relative z-50">
        <div className="font-bold text-lg tracking-widest text-[#fdfbf7]">正在生成你的专属车票...</div>
      </div>
    );
  }

  const { city, rank, userCoords } = resultData;

  const handleSave = async () => {
    if (!isUnlocked || !unlockedData) {
      document.getElementById('btn-show-unlock')?.click();
      return;
    }

    if (!ticketRef.current || isSaving) return;

    // 【手机端权限核心】：在用户点击手势有效的第一毫秒同步将文案写入剪贴板！
    // 彻底杜绝因异步回调耗时导致微信/移动端判定手势过期而报系统级错误「未能复制到剪切板」
    const shareUrl = buildCityShareUrl(city);
    const shareCopy = generateCityShareCopy(city, rank, shareUrl);
    syncCopyText(shareCopy);

    setIsSaving(true);
    setIsGeneratingImage(true);

    setTimeout(() => {
      const node = ticketRef.current;
      if (!node) {
        setIsSaving(false);
        setIsGeneratingImage(false);
        return;
      }

      toPng(node, {
        cacheBust: true,
        pixelRatio: 2.5,
        quality: 1,
        style: { transform: 'scale(1)', transformOrigin: 'top left', margin: '0' }
      })
        .then(async (dataUrl) => {
          const isMobile = isMobileDevice() || isWeChatEnvironment();

          if (isMobile) {
            // 移动端/微信端：呼出长图保存浮层，指引长按保存或发送给朋友，文案在第一拍已稳健写入剪贴板
            setPreviewImage(dataUrl);
            setToastMessage('车票长图已就绪！文案已复制');
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);

            // 普通手机浏览器顺带尝试触发系统文件下载
            try {
              const link = document.createElement('a');
              link.download = `心灵逃跑车票-${city.name || 'ticket'}.png`;
              link.href = dataUrl;
              link.click();
            } catch (e) {}
          } else {
            // PC 电脑端：触发高清小票文件下载，并写入富文本图文剪贴板
            const link = document.createElement('a');
            link.download = `心灵逃跑车票-${city.name || 'ticket'}.png`;
            link.href = dataUrl;
            link.click();

            await copyImageAndTextToClipboard(dataUrl, shareCopy);

            setToastMessage('车票已保存！分享文案已复制');
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3500);
          }
        })
        .catch((err) => {
          console.error('Failed to save image', err);
          alert('保存失败，请截图保存');
        })
        .finally(() => {
          setIsSaving(false);
          setIsGeneratingImage(false);
        });
    }, 150);
  };

  return (
    <section className="page-section w-full max-w-md mx-auto py-8 min-h-screen flex flex-col items-center justify-center px-4">
      {/* 城市专属定制车票顶标 */}
      <div className="w-full flex justify-center items-center mb-3 select-none">
        <div className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-black/5 border border-black/10 text-xs font-mono text-gray-700 backdrop-blur-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold">灵魂归宿 · 【{city.name}】专属定制车票</span>
        </div>
      </div>

      <div 
        ref={ticketRef}
        id="ticket-capture"
        className={`relative ${currentStyle.bg} ${currentStyle.text} w-full flex flex-col overflow-hidden pb-6 rounded-lg shadow-[0_15px_50px_rgba(0,0,0,0.12)] ${currentStyle.cardBorder} transition-colors duration-300 before:content-[''] before:absolute before:top-[56%] before:-translate-y-1/2 before:-left-4 before:w-8 before:h-8 before:bg-current before:rounded-full before:shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] before:opacity-15 after:content-[''] after:absolute after:top-[56%] after:-translate-y-1/2 after:-right-4 after:w-8 after:h-8 after:bg-current after:rounded-full after:shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] after:opacity-15`}
      >
        {/* Top Section：电影感沉浸式车票头部（嵌入 16 城市左右结构背景图） */}
        {(() => {
          const cityConfig = currentStyle;
          return (
            <div className={`p-6 relative mt-0 overflow-hidden ${currentStyle.headerBg} ${currentStyle.headerText} rounded-t-lg transition-colors duration-300`}>
              {/* 城市专属电影感隐居背景画卷 (右侧风景 + 中部羽化 + 左侧深色留白) */}
              <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
                <img 
                  src={`/images/cities/${cityConfig.pinyin}.png`}
                  alt={city.name}
                  className="w-full h-full object-cover object-right transform scale-105 origin-right transition-transform duration-700"
                  onError={(e) => {
                    // 兜底隐藏，不阻塞文字
                    e.currentTarget.style.display = 'none';
                  }}
                />
                {/* 5风格动态横向渐变遮罩：确保左侧文字 100% 锐利清晰易读，右侧风景自然透出 */}
                <div className={`absolute inset-0 ${currentStyle.bannerOverlay}`} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/25 pointer-events-none" />
              </div>

              {/* 前景车票信息层 */}
              <div className="relative z-10">
                <div className="text-center font-mono text-[11px] font-bold opacity-75 mb-3 tracking-widest text-white drop-shadow-sm">
                  {'> 你是本次列车第 '}<span>{rank}</span>{' 位乘车的旅客 <'}
                </div>
                
                {/* 5风格防伪专属钢印 / 检票戳（未解锁时显示待验票状态，核销后盖已检票戳） */}
                <div className={`absolute top-[28px] right-[10px] border-4 ${(isUnlocked && unlockedData) ? currentStyle.stampBorder : 'border-amber-400 text-amber-300 bg-amber-500/20 backdrop-blur-xs'} rounded-full w-20 h-20 flex flex-col items-center justify-center font-bold text-xs -rotate-12 opacity-95 text-center leading-tight transition-all duration-300 select-none pointer-events-none z-20 shadow-md`}>
                  <span>{(isUnlocked && unlockedData) ? currentStyle.stampTitle : '待验票'}</span>
                  <span className="text-[9px] tracking-widest mt-0.5 opacity-85">{(isUnlocked && unlockedData) ? currentStyle.stampSub : 'UNCHECKED'}</span>
                </div>

                <div className="flex items-center justify-between gap-2 mb-3 flex-wrap pr-16 sm:pr-20">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-80 whitespace-nowrap">
                    {currentStyle.badgeText}
                  </span>
                  {cityConfig.sanctuary && (
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded ${currentStyle.sanctuaryBadge} whitespace-nowrap`}>
                      <MapPin className="w-2.5 h-2.5 shrink-0" />
                      <span>避难所取景 · {cityConfig.sanctuary}</span>
                    </span>
                  )}
                </div>

                <div className="flex justify-between items-start mb-5 mt-1">
                  <div>
                    <div className="font-mono text-xs opacity-75 mb-0.5 tracking-wider">TRAIN NO.</div>
                    <div className="font-bold text-lg tracking-wide drop-shadow-sm">M-2024</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-xs opacity-75 mb-0.5 tracking-wider">CLASS</div>
                    <div className="font-bold text-lg tracking-wide drop-shadow-sm">SOUL</div>
                  </div>
                </div>

                <div className="font-mono text-xs opacity-75 mb-0.5 tracking-wider">DESTINATION</div>
                <div className="flex items-baseline gap-2.5 mb-2 flex-wrap max-w-[72%]">
                  <h2 className="text-3xl sm:text-5xl font-black tracking-tighter drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">
                    {city.name}
                  </h2>
                  <span className="text-xs sm:text-sm font-bold opacity-90 mb-1 drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)] leading-snug break-words">
                    {city.title}
                  </span>
                </div>

                {/* 精神市民常住身份证号 */}
                <div className="mt-2 flex items-center justify-between border-t border-b py-1.5 border-white/20 font-mono text-[11px] backdrop-blur-xs">
                  <span className="opacity-75">RESIDENT ID :</span>
                  <span className="font-bold tracking-wider whitespace-nowrap">{city.residentId || `CITIZEN-${city.name}-PASS`}</span>
                </div>
                
                <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-3">
                  {(city.tags || []).map((tag: string, i: number) => (
                    <span key={i} className={`${currentStyle.tagBgHeader || currentStyle.tagBg} text-xs px-2.5 py-1 font-bold rounded-xs transition-colors duration-300 shadow-sm whitespace-nowrap`}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

        {/* 撕票边缘虚线/齿线 */}
        <div className={`mx-4 my-2 transition-colors duration-300 ${currentStyle.tearStyle}`}></div>

        {/* Middle Section */}
        <div className="p-6 pb-2">
          {(() => {
            // 计算 5 维常模百分位与自尊高光特质
            let bestIdx = 0;
            let maxAbsZ = -1;
            const dimResults = NORM_STATS.map((stat, i) => {
              const raw = userCoords?.[stat.coordIndex] ?? 0;
              // 统一正向映射：左极统一避世/松弛/内敛(0%)，右极统一搞钱/繁华/进取(100%)
              const effRaw = stat.invert ? -raw : raw;
              const effMean = stat.invert ? -stat.mean : stat.mean;
              const z = (effRaw - effMean) / stat.std;
              const absZ = Math.abs(z);
              if (absZ > maxAbsZ) {
                maxAbsZ = absZ;
                bestIdx = i;
              }
              // 正态累积超越率 Φ(Z)
              const basePct = 0.5 * (1 + erf(z / Math.SQRT2)) * 100;
              // 防同质化微扰动 [-0.4%, +0.4%]
              const microHash = ((((Math.abs(raw) * 7.9 + rank * 3.1 + i * 4.3) % 1) - 0.5) * 0.8);
              const clampedPct = Math.max(8.5, Math.min(96.5, basePct + microHash));
              return {
                label: stat.label,
                leftLabel: stat.leftLabel,
                rightLabel: stat.rightLabel,
                raw,
                pctVal: clampedPct,
                pctStr: clampedPct.toFixed(1) + '%'
              };
            });

            const bestStat = NORM_STATS[bestIdx];
            const rawVal = userCoords?.[bestStat.coordIndex] ?? 0;
            const isPos = bestStat.invert ? (-rawVal >= -bestStat.mean) : (rawVal >= bestStat.mean);
            // 优先精确绑定 16 城市画像专属意境图腾
            const topTraitName = (city?.name && CITY_TRAITS[city.name]) 
              ? CITY_TRAITS[city.name] 
              : (isPos ? bestStat.positiveTrait : bestStat.negativeTrait);
            // 核心主导特质映射到 91.5% ~ 98.6% 的自尊高光击败率
            const primePct = (92.5 + ((rank * 13 + bestIdx * 17) % 55) / 10).toFixed(1) + '%';

            return (
              <>
                <div className="flex items-center justify-between mb-3 gap-2">
                  <span className="font-mono text-xs opacity-70 tracking-wider whitespace-nowrap shrink-0">5D SOUL SPECTRUM · 常模量化</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-current/20 opacity-80 whitespace-nowrap shrink-0">
                    NORM Φ(Z)
                  </span>
                </div>

                {/* 黄金自尊赋能高光 Badge (意境与传播：领先同行旅人) */}
                <div className={`mb-4 px-3 py-2 rounded border ${currentStyle.taglineColor} bg-current/5 flex items-center justify-between text-xs gap-2`}>
                  <div className="flex items-center gap-1.5 font-bold whitespace-nowrap shrink-0">
                    <span className="text-sm">🏆</span>
                    <span>【{topTraitName}】领先</span>
                  </div>
                  <div className="font-mono font-black text-xs sm:text-sm tracking-tight text-amber-500 whitespace-nowrap shrink-0">
                    {primePct} <span className="text-[10px] font-normal opacity-80 text-current">同行旅人</span>
                  </div>
                </div>

                {/* 爆款热梗双极频谱滑块系统：固定等宽居中胶囊，极度工整对称 */}
                <div className="mb-6 flex flex-col gap-3">
                  {dimResults.map((dim, i) => {
                    const isLeftDominant = dim.pctVal < 50;
                    return (
                      <div key={i} className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs">
                        {/* 左极标签 (0%)：固定等宽 + 文字水平居中 */}
                        <div className="w-[74px] sm:w-[82px] shrink-0">
                          <span 
                            className={`block w-full py-0.5 rounded text-center transition-all duration-300 whitespace-nowrap ${currentStyle.labelBg} ring-1 ring-current/25 shadow-xs ${
                              isLeftDominant ? 'font-black ring-current/50' : 'font-bold opacity-80'
                            }`}
                          >
                            {dim.leftLabel}
                          </span>
                        </div>

                        {/* 中间双极彩色细轨道 + 能量填充带 + 居中刻度 + 发光圆点游标 */}
                        <div className={`relative h-2.5 flex-1 rounded-full ${currentStyle.barTrack} border shadow-inner flex items-center min-w-[70px]`}>
                          {/* 动态能量填充带：与当前城市滤镜主题色深度契合 */}
                          <div 
                            style={{ width: dim.pctStr }} 
                            className={`h-full ${currentStyle.barFill} opacity-85 rounded-full transition-all duration-500`}
                          />

                          {/* 50% 居中分界细刻线 */}
                          <div className="absolute left-1/2 top-0 bottom-0 w-[1.5px] bg-white/60 -translate-x-1/2 pointer-events-none z-10" />
                          
                          {/* 发光圆点游标 Thumb */}
                          <div 
                            style={{ left: dim.pctStr }} 
                            className={`absolute w-3.5 h-3.5 -translate-x-1/2 rounded-full ${currentStyle.barFill} border-2 border-white shadow-[0_0_8px_rgba(0,0,0,0.4)] transition-all duration-500 z-20`}
                          />
                        </div>

                        {/* 右极标签 (100%)：固定等宽 + 文字水平居中 */}
                        <div className="w-[74px] sm:w-[82px] shrink-0">
                          <span 
                            className={`block w-full py-0.5 rounded text-center transition-all duration-300 whitespace-nowrap ${currentStyle.labelBg} ring-1 ring-current/25 shadow-xs ${
                              !isLeftDominant ? 'font-black ring-current/50' : 'font-bold opacity-80'
                            }`}
                          >
                            {dim.rightLabel}
                          </span>
                        </div>

                        {/* 右侧坐标刻度百分比：与城市主题字体深度共鸣 */}
                        <span className="w-11 text-right font-mono font-black text-[11px] sm:text-xs opacity-90 shrink-0">
                          {dim.pctStr}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            );
          })()}

          <div className="font-mono text-xs opacity-70 mb-3">DIAGNOSTIC REPORT</div>
          
          {(() => {
            const descRaw = city.desc || '';
            const descParts = descRaw.split('【');
            const introText = descParts[0] || '';
            const otherCards = descParts.slice(1);

            // 导语截取第一句黄金定调（约25-30字）作为免费前瞻诱饵，后半段约70%直接纳入大面积毛玻璃遮罩
            let previewIntro = '';
            const sentences = introText.split(/([。！？\n])/);
            if (sentences.length >= 2) {
              previewIntro = (sentences[0] + sentences[1]).trim();
            } else {
              previewIntro = introText.slice(0, 30).trim();
            }
            const blurIntroTail = introText.slice(previewIntro.length).trim();

            return (
              <>
                {/* 免费黄金定调前瞻（未解锁时展示前两句+省略号，解锁后展示完整导语） */}
                {(!isUnlocked || !unlockedData) ? (
                  <p className="text-[13px] leading-relaxed font-medium text-justify opacity-90 mb-2">
                    {previewIntro}
                    <span className="opacity-50">……</span>
                  </p>
                ) : (
                  <p className="text-[13px] leading-relaxed font-medium text-justify opacity-90 mb-4">
                    {introText.trim()}
                  </p>
                )}

                {/* 商业化锁定区：后 70% 深度生活避难指南（向上扩展至诊断报告后半段的大面积毛玻璃遮罩） */}
                <div className={`relative mt-1 ${(!isUnlocked || !unlockedData) ? 'min-h-[540px]' : ''}`}>
                  {/* 全域渐变毛玻璃遮罩层 */}
                  {(!isUnlocked || !unlockedData) && (
                    <OrderOverlay 
                      testId="city-personality" 
                      cityName={city?.name}
                      cityId={city?.id}
                      onSuccess={(data) => {
                        setIsUnlocked(true);
                        if (data) {
                          setUnlockedData(data);
                          if (city?.name) {
                            profilesRef.current[city.name] = data;
                          }
                        }
                      }} 
                    />
                  )}

                  {/* 未解锁时渲染导语后半段、精神画像卡片及生活切片骨架屏，施加重度 blur-[5px] 虚化 */}
                  {(!isUnlocked || !unlockedData) ? (
                    <div className="space-y-4 filter blur-[5px] select-none pointer-events-none opacity-40 py-1">
                      {/* 被虚化的导语后半段 */}
                      {blurIntroTail && (
                        <p className="text-[13px] leading-relaxed font-medium text-justify">
                          {blurIntroTail}
                        </p>
                      )}

                      {/* 被虚化的精神画像卡片 */}
                      {otherCards.length > 0 && (() => {
                        const [title, ...contentParts] = otherCards[0].split('】');
                        const content = contentParts.join('】').trim();
                        return (
                          <div className={`relative p-4 pt-7 mt-3 rounded-sm border ${currentStyle.taglineColor} bg-transparent shadow-sm`}>
                            <div className={`absolute -top-3 left-3 font-bold text-xs rounded-full border ${currentStyle.taglineColor} ${currentStyle.bg} shadow-sm overflow-hidden`}>
                              <div className={`px-3 py-1 w-full h-full ${currentStyle.labelBg}`}>
                                {title}
                              </div>
                            </div>
                            <p className="text-[13px] leading-relaxed font-medium text-justify">
                              {content}
                            </p>
                          </div>
                        );
                      })()}

                      {/* 骨架 1: 城市名言 */}
                      <div className="p-4 bg-black/5 border-l-4 border-current/30 rounded-r">
                        <div className="h-4 bg-current/25 rounded w-3/4 animate-pulse"></div>
                      </div>

                      {/* 骨架 2: 24h 隐居日程 */}
                      <div className={`p-4 rounded border ${currentStyle.taglineColor} bg-black/5 space-y-3`}>
                        <div className="flex justify-between items-center border-b pb-2 border-current/10">
                          <div className="h-3.5 w-44 bg-current/30 rounded animate-pulse"></div>
                          <div className="h-2.5 w-16 bg-current/20 rounded"></div>
                        </div>
                        <div className="space-y-2.5">
                          <div className="flex gap-2.5 items-center">
                            <div className="h-3 w-12 bg-current/30 rounded"></div>
                            <div className="h-3 w-5/6 bg-current/20 rounded animate-pulse"></div>
                          </div>
                          <div className="flex gap-2.5 items-center">
                            <div className="h-3 w-12 bg-current/30 rounded"></div>
                            <div className="h-3 w-3/4 bg-current/20 rounded animate-pulse"></div>
                          </div>
                          <div className="flex gap-2.5 items-center">
                            <div className="h-3 w-12 bg-current/30 rounded"></div>
                            <div className="h-3 w-4/5 bg-current/20 rounded animate-pulse"></div>
                          </div>
                        </div>
                      </div>

                      {/* 骨架 3: 城市治愈处方 */}
                      <div className={`p-4 rounded border ${currentStyle.taglineColor} bg-black/5 space-y-3`}>
                        <div className="flex justify-between items-center border-b pb-2 border-current/10">
                          <div className="h-3.5 w-36 bg-current/30 rounded animate-pulse"></div>
                          <div className="h-2.5 w-14 bg-current/20 rounded"></div>
                        </div>
                        <div className="space-y-2">
                          <div className="h-3 w-3/4 bg-current/20 rounded animate-pulse"></div>
                          <div className="h-3 w-2/3 bg-current/20 rounded animate-pulse"></div>
                          <div className="h-3 w-4/5 bg-current/20 rounded animate-pulse"></div>
                        </div>
                      </div>

                      {/* 骨架 4: 相克城市避雷预警 */}
                      <div className="p-4 rounded border border-red-500/20 bg-red-500/5 space-y-2">
                        <div className="h-3 w-32 bg-red-500/30 rounded animate-pulse"></div>
                        <div className="h-4 w-1/3 bg-red-500/25 rounded"></div>
                        <div className="h-3 w-full bg-red-500/20 rounded animate-pulse"></div>
                      </div>
                    </div>
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      transition={{ duration: 0.4 }}
                      className="space-y-4"
                    >
                      {/* 解锁后展示完整的深度卡片（精神画像、生活透镜、附带建议） */}
                      {otherCards.map((part: string, idx: number) => {
                        const [title, ...contentParts] = part.split('】');
                        const content = contentParts.join('】').trim();
                        return (
                          <div key={idx} className={`relative p-4 pt-7 mt-3 rounded-sm border ${currentStyle.taglineColor} bg-transparent shadow-sm`}>
                             <div className={`absolute -top-3 left-3 font-bold text-xs rounded-full border ${currentStyle.taglineColor} ${currentStyle.bg} shadow-sm overflow-hidden`}>
                               <div className={`px-3 py-1 w-full h-full ${currentStyle.labelBg}`}>
                                 {title}
                               </div>
                             </div>
                             <p className="text-[13px] leading-relaxed font-medium text-justify opacity-90">
                               {content}
                             </p>
                          </div>
                        );
                      })}

                      {/* 城市意境引言 */}
                      {city.quote && (
                        <div className={`mt-2 p-4 ${currentStyle.quoteBg} border-l-4 italic font-bold text-sm transition-colors duration-300 rounded-r shadow-sm`}>
                          “{city.quote}”
                        </div>
                      )}
              {/* 深度生活切片 1: 24小时精神隐居日程 */}
              {(unlockedData?.schedule || city?.schedule) && (
                <div className={`mt-5 p-3.5 sm:p-4 rounded border ${currentStyle.taglineColor} bg-black/5 flex flex-col gap-2.5 shadow-sm`}>
                  <div className="flex items-center justify-between border-b pb-1.5 border-current/10 gap-2 min-w-0">
                    <span className="font-mono text-[11px] sm:text-xs font-bold tracking-wider whitespace-nowrap shrink-0">[ 24H 隐居日程 · RETREAT ]</span>
                    <span className="font-mono text-[9px] sm:text-[10px] opacity-60 whitespace-nowrap shrink-0">SOUL DIARY</span>
                  </div>
                  <div className="text-xs space-y-2 mt-1">
                    {(unlockedData?.schedule?.morning || city?.schedule?.morning) && (
                      <div className="flex items-start gap-2 [text-wrap:pretty]">
                        <span className="font-bold opacity-70 shrink-0 font-mono text-[11px] whitespace-nowrap">🌅 晨光</span>
                        <span className="opacity-90 leading-snug break-words">{unlockedData?.schedule?.morning || city?.schedule?.morning}</span>
                      </div>
                    )}
                    {(unlockedData?.schedule?.afternoon || city?.schedule?.afternoon) && (
                      <div className="flex items-start gap-2 [text-wrap:pretty]">
                        <span className="font-bold opacity-70 shrink-0 font-mono text-[11px] whitespace-nowrap">☕ 午后</span>
                        <span className="opacity-90 leading-snug break-words">{unlockedData?.schedule?.afternoon || city?.schedule?.afternoon}</span>
                      </div>
                    )}
                    {(unlockedData?.schedule?.night || city?.schedule?.night) && (
                      <div className="flex items-start gap-2 [text-wrap:pretty]">
                        <span className="font-bold opacity-70 shrink-0 font-mono text-[11px] whitespace-nowrap">🌙 深夜</span>
                        <span className="opacity-90 leading-snug break-words">{unlockedData?.schedule?.night || city?.schedule?.night}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 深度生活切片 2: 城市治愈处方 */}
              {(unlockedData?.curePrescription || city?.curePrescription) && (
                <div className={`mt-4 p-3.5 sm:p-4 rounded border ${currentStyle.taglineColor} bg-black/5 flex flex-col gap-2 shadow-sm`}>
                  <div className="flex items-center justify-between border-b pb-1.5 border-current/10 gap-2 min-w-0">
                    <span className="font-mono text-[11px] sm:text-xs font-bold tracking-wider whitespace-nowrap shrink-0">[ 城市治愈处方 · PRESCRIPTION ]</span>
                    <span className="font-mono text-[9px] sm:text-[10px] opacity-60 whitespace-nowrap shrink-0">Rx ONLY</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 text-xs mt-1">
                    {(unlockedData?.curePrescription?.dazePlace || city?.curePrescription?.dazePlace) && (
                      <div className="flex items-start gap-1.5 leading-snug [text-wrap:pretty] break-words">
                        <span className="font-bold opacity-70 shrink-0 whitespace-nowrap">🧘 发呆圣地：</span>
                        <span className="opacity-90">{unlockedData?.curePrescription?.dazePlace || city?.curePrescription?.dazePlace}</span>
                      </div>
                    )}
                    {(unlockedData?.curePrescription?.soulFood || city?.curePrescription?.soulFood) && (
                      <div className="flex items-start gap-1.5 leading-snug [text-wrap:pretty] break-words">
                        <span className="font-bold opacity-70 shrink-0 whitespace-nowrap">🍜 灵魂碳水：</span>
                        <span className="opacity-90">{unlockedData?.curePrescription?.soulFood || city?.curePrescription?.soulFood}</span>
                      </div>
                    )}
                    {(unlockedData?.curePrescription?.spiritBuddy || city?.curePrescription?.spiritBuddy) && (
                      <div className="flex items-start gap-1.5 leading-snug [text-wrap:pretty] break-words">
                        <span className="font-bold opacity-70 shrink-0 whitespace-nowrap">🤝 精神搭子：</span>
                        <span className="opacity-90">{unlockedData?.curePrescription?.spiritBuddy || city?.curePrescription?.spiritBuddy}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 深度生活切片 3: 相克城市毒舌预警 */}
              {(unlockedData?.toxicCity || city?.toxicCity) && (
                <div className="mt-4 p-3.5 rounded border border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400 flex flex-col gap-1.5 shadow-sm">
                  <div className="flex items-center justify-between border-b pb-1 border-red-500/20 gap-2 min-w-0">
                    <span className="font-mono text-[11px] sm:text-xs font-bold tracking-wider whitespace-nowrap shrink-0">⚠️ 相克城市避雷预警</span>
                    <span className="text-[9px] sm:text-[10px] font-mono uppercase bg-red-500/20 px-1.5 py-0.5 rounded whitespace-nowrap shrink-0">HIGH HAZARD</span>
                  </div>
                  <div className="text-xs mt-1 [text-wrap:pretty] break-words">
                    <div className="font-bold text-[13px] mb-0.5 whitespace-nowrap">{unlockedData?.toxicCity?.name || city?.toxicCity?.name}</div>
                    <div className="leading-relaxed opacity-90 text-[12px]">{unlockedData?.toxicCity?.reason || city?.toxicCity?.reason}</div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
              </>
            );
          })()}
        </div>

        {/* Bottom Section */}
        <div className="px-6 flex flex-col items-center mt-6">
          <div className="flex items-center justify-center gap-[2.5px] h-8 opacity-80 overflow-hidden w-full max-w-[240px] my-1 select-none">
            {[2, 1, 3, 1, 2, 1, 4, 1, 2, 3, 1, 2, 1, 3, 2, 1, 2, 4, 1, 2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 2, 1, 3, 1, 2, 4, 1, 2, 1].map((w, idx) => (
              <div
                key={idx}
                style={{ width: `${w}px` }}
                className={`h-full ${currentStyle.barFill} shrink-0`}
              />
            ))}
          </div>
          <div className="font-mono text-[10px] opacity-60 mt-1 mb-2 font-bold">{currentStyle.serialPrefix}</div>

          {/* 截屏瞬间动态挂载纯前端矢量二维码：常态网页完全隐藏，绝不破坏车票电影感 */}
          {isGeneratingImage && (
            <div id="ticket-qrcode-container" className={`mt-3 pt-3 border-t-2 border-dashed ${currentStyle.divider} flex flex-col items-center justify-center text-center animate-fadeIn w-full`}>
              <div className="bg-white border-2 border-black p-1.5 shadow-[2.5px_2.5px_0px_#000] inline-block mb-1.5">
                {qrSvg ? (
                  <div 
                    className="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                    dangerouslySetInnerHTML={{ __html: qrSvg }}
                  />
                ) : (
                  <div className="w-24 h-24 sm:w-28 sm:h-28 bg-black flex items-center justify-center text-white text-[10px] font-mono">
                    心灵逃跑车票
                  </div>
                )}
              </div>
              <div className="font-mono">
                <div className="text-[10px] font-black tracking-wider uppercase">
                  [ 扫码开始测试 · 测测契合你灵魂的那座城 ]
                </div>
                <p className="text-[8.5px] opacity-70 font-bold mt-0.5 tracking-tight">
                  长按扫码立即测算 · 查收你的专属心灵避难所车票
                </p>
              </div>
            </div>
          )}

          <div className={`font-mono text-[9px] opacity-50 text-center tracking-widest mt-1 border-t ${currentStyle.taglineColor} pt-2 w-full`}>
            * 本档案结果仅供娱乐参考，请凭直觉执行
          </div>
        </div>
      </div>

      <div className="w-full mt-8 flex flex-col gap-4 pb-8">
        <button 
          id="btn-save"
          onClick={handleSave} 
          disabled={isSaving}
          className={`w-full ${currentStyle.btnBg} py-4 rounded font-bold tracking-[0.15em] text-base active:scale-[0.98] transition-all duration-300 shadow-[0_8px_25px_rgba(0,0,0,0.2)] ${isSaving ? 'opacity-70 cursor-wait' : 'cursor-pointer'}`}
        >
          {(!isUnlocked || !unlockedData)
            ? '解锁并分享我的灵魂老家'
            : (isSaving ? '正在生成专属车票长图...' : '分享我的灵魂老家')}
        </button>

        <div className="flex justify-center gap-4 mt-1 mb-2 font-mono font-bold w-full">
          <button onClick={() => { reset(); router.push('/city'); }} className="text-xs text-gray-400 hover:text-[#1a1a1a] transition-colors tracking-widest underline underline-offset-4 min-h-[44px] inline-flex items-center justify-center cursor-pointer touch-manipulation active:scale-95 px-3">
            [ 重新购买车票 ]
          </button>
          
          <button onClick={() => window.location.href = '/'} className="text-xs text-gray-400 hover:text-[#1a1a1a] transition-colors underline underline-offset-4 tracking-widest min-h-[44px] inline-flex items-center justify-center cursor-pointer touch-manipulation active:scale-95 px-3">
            [ 返回测试枢纽大厅 ]
          </button>
        </div>
      </div>

      {/* 操作提示 Toast */}
      {showToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] bg-black/90 text-white border-2 border-white/20 px-4 py-2.5 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.4)] flex items-center gap-2 text-xs sm:text-sm font-bold animate-fadeIn">
          <span className="text-emerald-400 font-mono text-base font-black">✔</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 移动端/微信端专属：长图保存与图文交付弹窗 */}
      {previewImage && (
        <div className="fixed inset-0 z-[160] bg-black/85 backdrop-blur-md flex flex-col items-center justify-between p-3 sm:p-4 font-sans animate-fadeIn">
          {/* 顶部标题与关闭按钮 */}
          <div className="w-full max-w-sm flex items-center justify-between py-2 border-b border-white/20 shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
              <span className="text-white font-black text-xs sm:text-sm tracking-wide">车票长图已就绪</span>
            </div>
            <button 
              onClick={() => setPreviewImage(null)} 
              className="text-white hover:text-emerald-300 font-mono font-black text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 border border-white/30 rounded cursor-pointer touch-manipulation active:scale-95 transition-all"
            >
              ✕ 关闭
            </button>
          </div>

          {/* 中间图片核心交互区：长图展示，支持长按保存到相册或发送给微信朋友 */}
          <div className="flex-1 w-full max-w-sm overflow-y-auto my-2.5 flex flex-col items-center hide-scrollbar rounded shadow-[0_8px_30px_rgb(0,0,0,0.5)]">
            {/* 强视觉长按指引条 */}
            <div className="bg-amber-300 text-black text-[11px] sm:text-xs font-black py-2 px-3 w-full text-center border-2 border-black sticky top-0 z-10 shadow-sm flex items-center justify-center gap-1.5">
              <span>👇</span>
              <span>请「长按下方图片」保存到相册或发给朋友</span>
            </div>
            <div className="p-1 bg-white border-2 border-t-0 border-black w-full flex justify-center">
              <img 
                src={previewImage} 
                alt="心灵逃跑车票长图" 
                className="w-full max-w-[320px] h-auto object-contain block select-none pointer-events-auto shadow-md"
                style={{ touchAction: 'auto', WebkitTouchCallout: 'default' }}
              />
            </div>
          </div>

          {/* 底部贴心指引卡片 */}
          <div className="w-full max-w-sm bg-white border-2 border-black p-3 shadow-[4px_4px_0px_#000] flex flex-col gap-2 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-black text-black">
                <span className="text-emerald-600 text-sm font-black">✔</span>
                <span>分享文案已成功复制</span>
              </div>
              <button 
                onClick={() => {
                  const shareUrl = buildCityShareUrl(city);
                  const shareCopy = generateCityShareCopy(city, rank, shareUrl);
                  syncCopyText(shareCopy);
                  setToastMessage('文案已重新复制！');
                  setShowToast(true);
                  setTimeout(() => setShowToast(false), 2000);
                }}
                className="text-[10px] text-gray-500 underline font-mono hover:text-black cursor-pointer"
              >
                [ 重新复制文案 ]
              </button>
            </div>
            <p className="text-[10px] text-gray-600 font-bold leading-tight">
              💡 去微信发朋友圈或聊天时：长按输入框「粘贴」文案，再从相册选择刚保存的车票长图即可！
            </p>
            <button 
              onClick={() => setPreviewImage(null)}
              className="w-full bg-black text-white font-black text-xs py-2.5 border-2 border-black shadow-[2px_2px_0px_#444] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer touch-manipulation"
            >
              我知道了 · 返回测试
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
