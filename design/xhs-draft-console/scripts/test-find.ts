import { findMasterPoster } from '../worker/slice-helper';
const cardsDir = 'e:/AI/Antigravity/小红书/design/product-docs/大女主觉醒测试/assets/结果测试截图/cards';
console.log('r1_m1:', findMasterPoster(cardsDir, 'r1_m1'));
console.log('r2_m1:', findMasterPoster(cardsDir, 'r2_m1'));
console.log('r3_m1:', findMasterPoster(cardsDir, 'r3_m1'));
