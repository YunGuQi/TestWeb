/**
 * 心理测评产品矩阵组件 (Test Matrix Component)
 * 供所有测评项目统一调用，生成底部引流按钮及弹窗。
 */

const MATRIX_DATA = [
{ id: 'city-matching-test', title: '性格城市匹配测试', subtitle: '哪座城市是你的灵魂归属？', tags: ['生活', '趣味'], developed: true , previewImg: 'https://raw.githubusercontent.com/YunGuQi/TestWeb/main/common/city-matching-test/preview.jpg', desc: '<p class="mb-2"><b class="text-white">【测评简介】</b><br>每个人都有属于自己的“能量城市”。在适合的城市生活，你会感到如鱼得水。</p><p><b class="text-white">【评估维度】</b><br>生活节奏偏好、社交距离需求、气候适应性、文化包容度。</p>', price: '0.99', oldPrice: '1.50' },
    { id: 'five-elements-city-test', title: '五行本命城市测算', subtitle: '勘探地气，寻找你的命定之城', tags: ['玄学', '趣味', '生活'], developed: true , previewImg: 'https://raw.githubusercontent.com/YunGuQi/TestWeb/main/common/five-elements-city-test/preview.jpg', desc: '<p class="mb-2"><b class="text-white">【测评简介】</b><br>结合性格投射与玄学五行，为你生成一份专属的“异地迁徙调令”。</p><p><b class="text-white">【评估维度】</b><br>金(秩序)、木(生长)、水(包容)、火(激情)、土(安稳)。</p>', price: '0.99', oldPrice: '1.50' },
    { id: 'emotional-friction-test', title: '深度情绪内耗测试', subtitle: '测一测你的精神内耗程度，开出一剂情绪处方', tags: ['心理健康', '专业'], developed: true , previewImg: 'https://raw.githubusercontent.com/YunGuQi/TestWeb/main/common/emotional-friction-test/preview.jpg', desc: '<p class="mb-2"><b class="text-white">【测评简介】</b><br>深度解析你的底层心理逻辑，找到内心真实的渴望。</p><p><b class="text-white">【如有期待】</b><br>本测试正在紧锣密鼓开发中，敬请期待。</p>', price: '0.00', oldPrice: '9.90' },
    { id: 'scl90', title: 'SCL-90 心理健康测评', subtitle: '国际通用 · 全面心理体检', tags: ['心理健康', '专业'], developed: false, hot: true , desc: '<p class="mb-2"><b class="text-white">【测评简介】</b><br>国际通用的心理健康“体检表”，广泛应用于医疗与心理咨询领域。</p><p><b class="text-white">【评估维度】</b><br>涵盖躯体化、强迫、人际敏感、抑郁、焦虑、敌对、恐怖、偏执、精神病性等10大核心心理指标。</p>', price: '0.99', oldPrice: '1.50' },
    { id: 'love_possession', title: '恋爱占有欲测试', subtitle: '你的爱是由于不安还是深情？', tags: ['恋爱', '情感'], developed: false, hot: true , desc: '<p class="mb-2"><b class="text-white">【测评简介】</b><br>爱一个人就想占有TA？适度的占有欲是爱的表现，过度的占有欲则是关系的毒药。</p><p><b class="text-white">【评估维度】</b><br>占有欲强度、情感安全感、控制倾向、独立性需求。</p>', price: '0.99', oldPrice: '1.50' },
    { id: 'mbti_16', title: 'MBTI 16型人格测试', subtitle: '探索你的核心性格代码', tags: ['人格', 'MBTI'], developed: false , desc: '<p class="mb-2"><b class="text-white">【测评简介】</b><br>全球最流行的性格测试工具，帮你找到自己在生活、工作、恋爱中的“出厂设置”。</p><p><b class="text-white">【评估维度】</b><br>E/I (外向/内向)、S/N (实感/直觉)、T/F (理智/情感)、J/P (判断/感知)。</p>', price: '0.99', oldPrice: '1.50' },
    { id: 'mbti_love', title: 'MBTI 恋爱理想型测试', subtitle: '谁才是你的灵魂伴侣？', tags: ['恋爱', 'MBTI'], developed: false , desc: '<p class="mb-2"><b class="text-white">【测评简介】</b><br>基于MBTI人格理论，精准匹配最适合你的伴侣类型。</p><p><b class="text-white">【如有期待】</b><br>本测试正在紧锣密鼓开发中，将深度解析你的依恋需求与适配人格。</p>', price: '0.99', oldPrice: '1.50' },
    { id: 'childhood', title: '童年创伤测试', subtitle: '疗愈内在小孩的第一步', tags: ['疗愈', '成长'], developed: false , desc: '<p class="mb-2"><b class="text-white">【测评简介】</b><br>看见童年的伤，是疗愈的开始。带你拥抱那个内心深处哭泣的小孩。</p><p><b class="text-white">【如有期待】</b><br>本测试正在开发中，将包含家庭功能评估与情感忽视分析。</p>', price: '0.99', oldPrice: '1.50' },
    { id: 'spiritual', title: '精神需求测试', subtitle: '你灵魂深处真正渴望什么？', tags: ['自我', '探索'], developed: false , desc: '<p class="mb-2"><b class="text-white">【测评简介】</b><br>拨开物质欲望的迷雾，直视灵魂深处的真实渴求。</p><p><b class="text-white">【如有期待】</b><br>本测试正在开发中，敬请期待。</p>', price: '0.99', oldPrice: '1.50' },
    { id: 'adhd', title: 'ADHD 注意力缺陷测试', subtitle: '总是分心？测测专注力', tags: ['健康', '科普'], developed: false , desc: '<p class="mb-2"><b class="text-white">【测评简介】</b><br>这是天赋还是障碍？科学评估你的专注力水平。</p><p><b class="text-white">【如有期待】</b><br>本测试正在开发中，敬请期待。</p>', price: '0.99', oldPrice: '1.50' },
    { id: 'appearance', title: '高颜值测试', subtitle: '你的美学风格属于哪一种？', tags: ['审美', '趣味'], developed: false , desc: '<p class="mb-2"><b class="text-white">【测评简介】</b><br>发现你的独特美学气质，找到最适合你的变美思路。</p><p><b class="text-white">【如有期待】</b><br>本测试正在开发中，敬请期待。</p>', price: '0.99', oldPrice: '1.50' },
    { id: 'attachment', title: '成人依恋类型测试', subtitle: '回避/焦虑/安全型？', tags: ['关系', '心理'], developed: false , desc: '<p class="mb-2"><b class="text-white">【测评简介】</b><br>深度解析你在亲密关系中的安全感来源与行为模式。</p><p><b class="text-white">【如有期待】</b><br>本测试正在开发中，敬请期待。</p>', price: '0.99', oldPrice: '1.50' },
    { id: 'female_type', title: '女性类型测试', subtitle: '探索你的女性力量原型', tags: ['性格', '女性'], developed: false , desc: '<p class="mb-2"><b class="text-white">【测评简介】</b><br>你是雅典娜、赫拉还是阿佛洛狄忒？探索你的原型力量。</p><p><b class="text-white">【如有期待】</b><br>本测试正在开发中，敬请期待。</p>', price: '0.99', oldPrice: '1.50' },
    { id: 'age_love', title: '年上年下恋爱人格', subtitle: '你适合“爹系”还是“奶狗”？', tags: ['恋爱', '趣味'], developed: false , desc: '<p class="mb-2"><b class="text-white">【测评简介】</b><br>测测你在恋爱中更适合扮演照顾者还是被照顾者。</p><p><b class="text-white">【如有期待】</b><br>本测试正在开发中，敬请期待。</p>', price: '0.99', oldPrice: '1.50' },
    { id: 'npd', title: 'NPD 自恋型人格测试', subtitle: '识别身边的“有毒”关系 (测他人)', tags: ['关系', '避坑'], developed: false , desc: '<p class="mb-2"><b class="text-white">【测评简介】</b><br>你的TA是否极度自负、缺乏共情？帮你快速识别危险关系。</p><p><b class="text-white">【如有期待】</b><br>本测试正在开发中，敬请期待。</p>', price: '0.99', oldPrice: '1.50' },
    { id: 'psy_age', title: '心理年龄测试', subtitle: '你的心智比实际年龄成熟吗？', tags: ['趣味', '认知'], developed: false , desc: '<p class="mb-2"><b class="text-white">【测评简介】</b><br>测试你的心理成熟度是否与生理年龄匹配。</p><p><b class="text-white">【如有期待】</b><br>本测试正在开发中，敬请期待。</p>', price: '0.99', oldPrice: '1.50' },
    { id: 'talent', title: '天赋测试', subtitle: '挖掘你被埋没的天生优势', tags: ['职场', '潜能'], developed: false , desc: '<p class="mb-2"><b class="text-white">【测评简介】</b><br>找到你的盖洛普优势领域，让努力事半功倍。</p><p><b class="text-white">【如有期待】</b><br>本测试正在开发中，敬请期待。</p>', price: '0.99', oldPrice: '1.50' },
    { id: 'animal', title: '动物性格测试', subtitle: '你的性格像哪种动物？', tags: ['趣味', '性格'], developed: false , desc: '<p class="mb-2"><b class="text-white">【测评简介】</b><br>老虎、孔雀、考拉、猫头鹰，测测你的职场性格原型。</p><p><b class="text-white">【如有期待】</b><br>本测试正在开发中，敬请期待。</p>', price: '0.99', oldPrice: '1.50' }
];

/**
 * 注入测试矩阵
 * @param {Object} options 
 * @param {string} options.containerId - 挂载按钮的DOM节点ID
 * @param {string} options.currentId - 当前测试的ID (会被过滤掉)
 * @param {string} options.theme - 主题风格 'light' | 'dark'
 */
function initTestMatrix({ containerId, currentId, theme = 'dark' }) {
    const container = document.getElementById(containerId);
    if (!container) return;

    window.MATRIX_CURRENT_ID = currentId;
    window.MATRIX_THEME = theme;

    // 1. 生成呼出按钮
    const isLight = theme === 'light';
    const btnClass = isLight 
        ? "w-full bg-[#1a1a1a] text-white py-4 rounded font-bold tracking-widest hover:bg-black active:scale-[0.98] transition-transform flex justify-center items-center gap-2 mt-4 shadow-md"
        : "w-full py-4 text-[15px] font-bold text-white bg-white/10 border border-white/20 rounded-full hover:bg-white/20 transition-all flex justify-center items-center gap-2 active:scale-[0.97] mt-4";
    
    const btnHtml = `
        <button onclick="openMatrixModal()" class="${btnClass}">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
            探索更多专业心理测评
        </button>
    `;
    container.innerHTML = btnHtml;

    // 2. 生成 List Modal
    let modal = document.getElementById('shared-matrix-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'shared-matrix-modal';
        
        const overlayClass = isLight
            ? "fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm opacity-0 pointer-events-none transition-opacity duration-300 flex flex-col justify-end"
            : "fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm opacity-0 pointer-events-none transition-opacity duration-300 flex flex-col justify-end";
            
        const cardClass = isLight
            ? "bg-[#f5f5f4] border-t border-[#d1cdc1] rounded-t-[2rem] pt-6 pb-[calc(2rem+env(safe-area-inset-bottom))] px-4 transform translate-y-full transition-transform duration-500 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] w-full max-w-lg mx-auto"
            : "bg-black/80 backdrop-blur-3xl border-t border-white/10 rounded-t-[2.5rem] pt-6 pb-[calc(2rem+env(safe-area-inset-bottom))] px-6 transform translate-y-full transition-transform duration-500 shadow-[0_-20px_60px_rgba(0,0,0,0.5)] w-full max-w-lg mx-auto";

        const titleClass = isLight ? "text-xl font-extrabold text-[#1a1a1a] tracking-tight mb-4 text-center font-ticket" : "text-2xl font-extrabold text-white tracking-tight mb-6 text-center";
        const handleClass = isLight ? "w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6" : "w-12 h-1 bg-white/20 rounded-full mx-auto mb-8";
        const closeBtnClass = isLight 
            ? "absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-500 hover:bg-gray-300 transition-colors"
            : "absolute top-6 right-6 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 text-white/60 hover:bg-white/20 transition-colors";

        modal.className = overlayClass;
        modal.onclick = (e) => {
            if (e.target === modal) closeMatrixModal();
        };

        let listHtml = '';

        // Map original index
        const rawDisplayData = MATRIX_DATA.map((test, index) => ({ test, originalIndex: index }));
        
        let currentTest = null;
        let emotionalTest = null;
        let others = [];

        rawDisplayData.forEach(item => {
            if (item.test.id === currentId) {
                currentTest = item;
            } else if (item.test.id === 'emotional-friction-test') {
                emotionalTest = item;
            } else {
                others.push(item);
            }
        });

        const displayData = [];
        if (currentTest) displayData.push(currentTest);
        if (emotionalTest) displayData.push(emotionalTest);
        displayData.push(...others);
        
        displayData.forEach((item, displayIdx) => {
            const test = item.test;
            const originalIdx = item.originalIndex;
            const isCurrent = test.id === currentId;
            
            const itemClass = isLight
                ? `block w-full bg-white p-4 rounded-xl border ${isCurrent ? 'border-blue-400 shadow-md' : 'border-gray-200 hover:border-gray-300 shadow-sm'} transition-colors active:scale-[0.98] mb-3 ${!test.developed ? 'opacity-50 grayscale' : ''}`
                : `block w-full ${isCurrent ? 'bg-white/10 border-blue-500/50' : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06]'} p-5 rounded-2xl border transition-colors active:scale-[0.98] mb-3 ${!test.developed ? 'opacity-40 grayscale' : ''}`;
                
            const itemTitleClass = isLight ? "font-bold text-[#1a1a1a] text-[15px] mb-1" : "font-extrabold text-white text-[15px] tracking-tight mb-1";
            const itemDescClass = isLight ? "text-xs text-gray-500" : "text-[13px] text-gray-400 font-medium mb-3";
            const tagClass = isLight ? "text-[9px] px-2 py-0.5 bg-gray-100 rounded text-gray-500 border border-gray-200" : "text-[10px] px-2.5 py-1 bg-white/5 rounded-full text-gray-300 border border-white/10";
            const numClass = isLight ? "text-[10px] font-mono text-gray-400 bg-gray-100 px-1 py-0.5 rounded mr-2" : "text-[10px] font-mono text-cyberblue bg-cyberblue/10 px-1.5 py-0.5 rounded mr-2";
            const arrowColor = isLight ? "text-gray-300" : "text-white/20";
            
            const badge = test.developed ? '' : `<span class="px-1.5 py-0.5 ${isLight?'bg-gray-200 text-gray-500':'bg-red-500/10 text-red-400'} text-[9px] rounded uppercase font-bold tracking-wider ml-2">DEV</span>`;
            const hotBadge = test.hot ? `<span class="px-1.5 py-0.5 bg-red-100 text-red-500 text-[9px] rounded uppercase font-bold tracking-wider ml-2">HOT</span>` : '';
            const currentBadge = isCurrent ? `<span class="px-1.5 py-0.5 bg-blue-100 text-blue-500 text-[9px] rounded uppercase font-bold tracking-wider ml-2 border border-blue-200">当前</span>` : '';

            listHtml += `
                <div class="${itemClass} cursor-pointer" onclick="openTestDetailModal(${originalIdx})">
                    <div class="flex items-center justify-between pointer-events-none">
                        <div class="flex-1 pr-4">
                            <div class="flex items-center mb-1.5">
                                <span class="${numClass}">0${displayIdx+1}</span>
                                <h4 class="${itemTitleClass}">${test.title} ${badge} ${hotBadge} ${currentBadge}</h4>
                            </div>
                            <p class="${itemDescClass}">${test.subtitle}</p>
                            <div class="flex flex-wrap gap-1.5 mt-2">
                                ${test.tags.map(t => `<span class="${tagClass}">${t}</span>`).join('')}
                            </div>
                        </div>
                        ${isCurrent ? '' : `<span class="${arrowColor} font-bold text-xl">&rsaquo;</span>`}
                    </div>
                </div>
            `;
        });

        modal.innerHTML = `
            <div class="${cardClass}" id="shared-matrix-card">
                <button class="${closeBtnClass}" onclick="closeMatrixModal()">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
                <div class="${handleClass}"></div>
                <h3 class="${titleClass}">专业心理测评矩阵</h3>
                <div class="flex flex-col max-h-[60vh] overflow-y-auto overflow-x-hidden hide-scrollbar pb-6 px-1">
                    ${listHtml}
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Detail Modal
        const detailModal = document.createElement('div');
        detailModal.id = 'shared-detail-modal';
        detailModal.className = overlayClass;
        detailModal.onclick = (e) => {
            if (e.target === detailModal) closeTestDetailModal();
        };
        detailModal.innerHTML = `
            <div class="${cardClass}" id="shared-detail-card" style="transition-duration: 400ms; max-height: 85vh; display: flex; flex-direction: column; overflow: hidden;">
                <button class="${closeBtnClass}" onclick="closeTestDetailModal()">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
                <div class="${handleClass}"></div>
                <div id="detail-modal-content" class="flex flex-col hide-scrollbar pb-4 px-1" style="overflow-y: auto; flex: 1; -webkit-overflow-scrolling: touch;">
                    <!-- content injected dynamically -->
                </div>
            </div>
        `;
        document.body.appendChild(detailModal);

        // Inject styles
        if (!document.getElementById('matrix-styles')) {
            const style = document.createElement('style');
            style.id = 'matrix-styles';
            style.innerHTML = `
                #shared-matrix-modal.show { opacity: 1; pointer-events: auto; z-index: 200; }
                #shared-matrix-modal.show #shared-matrix-card { transform: translateY(0); }
                #shared-detail-modal.show { opacity: 1; pointer-events: auto; z-index: 210; }
                #shared-detail-modal.show #shared-detail-card { transform: translateY(0); }
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .detail-desc p { margin-bottom: 0.5rem; }
                .detail-desc b { font-weight: bold; color: inherit; }
                /* Force text colors in detail desc based on theme */
                .theme-light .detail-desc b { color: #1a1a1a !important; }
                .theme-dark .detail-desc b { color: #ffffff !important; }
                .theme-light .detail-desc p { color: #4b5563 !important; }
                .theme-dark .detail-desc p { color: #9ca3af !important; }
            `;
            document.head.appendChild(style);
        }
    }
}

window.openMatrixModal = function() {
    const modal = document.getElementById('shared-matrix-modal');
    if(modal) {
        modal.style.display = 'flex';
        void modal.offsetWidth;
        modal.classList.add('show');
    }
};

window.closeMatrixModal = function() {
    const modal = document.getElementById('shared-matrix-modal');
    if(modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            if(!modal.classList.contains('show')) modal.style.display = 'none';
        }, 500);
    }
};

window.openTestDetailModal = function(idx) {
    const test = MATRIX_DATA[idx];
    const modal = document.getElementById('shared-detail-modal');
    const content = document.getElementById('detail-modal-content');
    const isLight = window.MATRIX_THEME === 'light';
    const isCurrent = test.id === window.MATRIX_CURRENT_ID;
    
    if(!modal || !content) return;

    // Determine target URL and Action
    let url = '#';
    let btnText = '去店铺购买 &rarr;';
    let btnClass = 'bg-[#3b82f6] hover:bg-[#2563eb] text-white';
    let disabled = false;
    let target = '_blank';

    if (isCurrent) {
        url = '#';
        btnText = '已在当前测试中';
        btnClass = isLight ? 'bg-gray-300 text-gray-500' : 'bg-white/10 text-white/40';
        disabled = true;
    } else if (!test.developed) {
        url = '#';
        btnText = '测试开发中 &rarr;';
        btnClass = isLight ? 'bg-[#1e293b] text-gray-400' : 'bg-[#1e293b] text-gray-400';
        disabled = true;
    } else if (test.id === 'emotional-friction-test') {
        url = `../${test.id}/index.html`;
        btnText = '立即测算 &rarr;';
        target = '_self';
    } else {
        // All other developed tests jump to XHS
        url = 'https://www.xiaohongshu.com/user/profile/601a023b000000000101fb44?xsec_token=YBzfLUaEGC48Kn_H4uNVPPudm5zNIfcyoxvRfnR2VZumo%3D&xsec_source=app_share&xhsshare=&shareRedId=ODYzQTM3N0s2NzUyOTgwNjY0OThKRzo9&apptime=1768918803&share_id=5e6b7913cee843faa97b7b0b9c4eecac&share_channel=copy_link';
    }

    const tagClass = isLight ? "text-[10px] px-2.5 py-1 bg-gray-100 border border-gray-200 rounded text-gray-600" : "text-[10px] px-3 py-1 bg-white/5 rounded border border-white/10 text-gray-300";
    const titleClass = isLight ? "text-2xl font-extrabold text-[#1a1a1a] tracking-tight mb-2" : "text-2xl font-extrabold text-white tracking-tight mb-2";
    const subtitleClass = isLight ? "text-sm text-[#3b82f6] font-medium mb-6" : "text-sm text-cyberblue font-medium mb-6";
    const boxClass = isLight ? "bg-white p-5 rounded-2xl border border-gray-200 mb-8" : "bg-white/[0.02] border border-white/10 p-5 rounded-2xl mb-8";
    
    // Add theme class for CSS desc overrides
    content.className = `flex flex-col hide-scrollbar pb-4 px-1 ${isLight ? 'theme-light' : 'theme-dark'}`;
    content.style.cssText = 'overflow-y: auto; flex: 1; -webkit-overflow-scrolling: touch;';

    const imgHtml = test.previewImg ? `
        <div class="w-full rounded-xl overflow-hidden mb-8 relative bg-[#1a1a1a] shadow-inner border ${isLight ? 'border-gray-200' : 'border-white/10'} p-2">
            <img src="${test.previewImg}" alt="${test.title}" onerror="this.style.display='none'" class="w-full h-auto max-h-[50vh] object-contain opacity-95 mx-auto">
            <div class="absolute top-4 right-4 px-2 py-0.5 bg-black/60 backdrop-blur text-white/90 text-[10px] rounded border border-white/20 tracking-wider z-10 shadow-md">SAMPLE</div>
        </div>
    ` : '';

    content.innerHTML = `
        <div class="flex gap-2 mb-4">
            ${test.tags.map(t => `<span class="${tagClass}">${t}</span>`).join('')}
        </div>
        <h2 class="${titleClass}">${test.title}</h2>
        <p class="${subtitleClass}">${test.subtitle}</p>
        
        <div class="${boxClass} detail-desc text-[13px] leading-relaxed">
            ${test.desc}
        </div>

        ${imgHtml}

        <div class="flex items-center justify-between mt-auto">
            <div class="flex flex-col">
                <span class="text-[10px] ${isLight ? 'text-gray-500' : 'text-gray-400'} mb-1">专属价</span>
                <div class="flex items-baseline gap-2">
                    <span class="${isLight ? 'text-[#1a1a1a]' : 'text-white'} font-black text-2xl">&yen;${test.price}</span>
                    <span class="${isLight ? 'text-gray-400' : 'text-gray-500'} text-xs line-through">&yen;${test.oldPrice}</span>
                </div>
            </div>
            
            <a href="${url}" target="${target}" class="px-8 py-3.5 rounded-full font-bold text-sm tracking-wide transition-all active:scale-95 ${btnClass}" ${disabled ? 'onclick="event.preventDefault();"' : ''}>
                ${btnText}
            </a>
        </div>
    `;

    modal.style.display = 'flex';
    void modal.offsetWidth;
    modal.classList.add('show');
};

window.closeTestDetailModal = function() {
    const modal = document.getElementById('shared-detail-modal');
    if(modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            if(!modal.classList.contains('show')) modal.style.display = 'none';
        }, 400);
    }
};
