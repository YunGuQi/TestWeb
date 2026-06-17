// 推荐测试数据 (已调整顺序：已开发在前)
const recommendedTests = [
    // 已开发
    { 
        id: 'scl90', 
        title: 'SCL-90 心理健康测评', 
        subtitle: '国际通用 · 全面心理体检', 
        desc: '<p><b>【测评简介】</b><br>国际通用的心理健康“体检表”，广泛应用于医疗与心理咨询领域。</p><p><b>【评估维度】</b><br>涵盖躯体化、强迫、人际敏感、抑郁、焦虑、敌对、恐怖、偏执、精神病性等10大核心心理指标。</p>',
        tags: ['心理健康', '专业'], 
        price: '1.5', 
        developed: true 
    },
    { 
        id: 'love_possession', 
        title: '恋爱占有欲测试', 
        subtitle: '你的爱是由于不安还是深情？', 
        desc: '<p><b>【测评简介】</b><br>爱一个人就想占有TA？适度的占有欲是爱的表现，过度的占有欲则是关系的毒药。</p><p><b>【评估维度】</b><br>占有欲强度、情感安全感、控制倾向、独立性需求。</p>',
        tags: ['恋爱', '情感'], 
        price: '1.5', 
        developed: true 
    },
    { 
        id: 'mbti_16', 
        title: 'MBTI 16型人格测试', 
        subtitle: '探索你的核心性格代码', 
        desc: '<p><b>【测评简介】</b><br>全球最流行的性格测试工具，帮你找到自己在生活、工作、恋爱中的“出厂设置”。</p><p><b>【评估维度】</b><br>E/I (外向/内向)、S/N (实感/直觉)、T/F (理智/情感)、J/P (判断/感知)。</p>',
        tags: ['人格', 'MBTI'], 
        price: '1.5', 
        developed: true 
    },
    { 
        id: 'city_match', 
        title: '性格城市匹配测试', 
        subtitle: '哪座城市是你的灵魂归属？', 
        desc: '<p><b>【测评简介】</b><br>每个人都有属于自己的“能量城市”。在适合的城市生活，你会感到如鱼得水。</p><p><b>【评估维度】</b><br>生活节奏偏好、社交距离需求、气候适应性、文化包容度。</p>',
        tags: ['生活', '趣味'], 
        price: '1.5', 
        developed: true 
    },
    
    // 待开发 (暂未开放)
    { 
        id: 'mbti_love', 
        title: 'MBTI 恋爱理想型测试', 
        subtitle: '谁才是你的灵魂伴侣？', 
        desc: '<p><b>【测评简介】</b><br>基于MBTI人格理论，精准匹配最适合你的伴侣类型。</p><p><b>【如有期待】</b><br>本测试正在紧锣密鼓开发中，将深度解析你的依恋需求与适配人格。</p>',
        tags: ['恋爱', 'MBTI'], 
        price: '1.5', 
        developed: false 
    },
    { 
        id: 'childhood', 
        title: '童年创伤测试', 
        subtitle: '疗愈内在小孩的第一步', 
        desc: '<p><b>【测评简介】</b><br>看见童年的伤，是疗愈的开始。带你拥抱那个内心深处哭泣的小孩。</p><p><b>【如有期待】</b><br>本测试正在开发中，将包含家庭功能评估与情感忽视分析。</p>',
        tags: ['疗愈', '成长'], 
        price: '1.5', 
        developed: false 
    },
    { 
        id: 'spiritual', 
        title: '精神需求测试', 
        subtitle: '你灵魂深处真正渴望什么？', 
        desc: '<p><b>【测评简介】</b><br>拨开物质欲望的迷雾，直视灵魂深处的真实渴求。</p><p><b>【如有期待】</b><br>本测试正在开发中，敬请期待。</p>',
        tags: ['自我', '探索'], 
        price: '1.5', 
        developed: false 
    },
    { 
        id: 'adhd', 
        title: 'ADHD 注意力缺陷测试', 
        subtitle: '总是分心？测测专注力', 
        desc: '<p><b>【测评简介】</b><br>这是天赋还是障碍？科学评估你的专注力水平。</p><p><b>【如有期待】</b><br>本测试正在开发中，敬请期待。</p>',
        tags: ['健康', '科普'], 
        price: '1.5', 
        developed: false 
    },
    { 
        id: 'appearance', 
        title: '高颜值测试', 
        subtitle: '你的美学风格属于哪一种？', 
        desc: '<p><b>【测评简介】</b><br>发现你的独特美学气质，找到最适合你的变美思路。</p><p><b>【如有期待】</b><br>本测试正在开发中，敬请期待。</p>',
        tags: ['审美', '趣味'], 
        price: '1.5', 
        developed: false 
    },
    { 
        id: 'attachment', 
        title: '成人依恋类型测试', 
        subtitle: '回避/焦虑/安全型？', 
        desc: '<p><b>【测评简介】</b><br>深度解析你在亲密关系中的安全感来源与行为模式。</p><p><b>【如有期待】</b><br>本测试正在开发中，敬请期待。</p>',
        tags: ['关系', '心理'], 
        price: '1.5', 
        developed: false 
    },
    { 
        id: 'female_type', 
        title: '女性类型测试', 
        subtitle: '探索你的女性力量原型', 
        desc: '<p><b>【测评简介】</b><br>你是雅典娜、赫拉还是阿佛洛狄忒？探索你的原型力量。</p><p><b>【如有期待】</b><br>本测试正在开发中，敬请期待。</p>',
        tags: ['性格', '女性'], 
        price: '1.5', 
        developed: false 
    },
    { 
        id: 'age_love', 
        title: '年上年下恋爱人格', 
        subtitle: '你适合“爹系”还是“奶狗”？', 
        desc: '<p><b>【测评简介】</b><br>测测你在恋爱中更适合扮演照顾者还是被照顾者。</p><p><b>【如有期待】</b><br>本测试正在开发中，敬请期待。</p>',
        tags: ['恋爱', '趣味'], 
        price: '1.5', 
        developed: false 
    },
    { 
        id: 'npd', 
        title: 'NPD 自恋型人格测试', 
        subtitle: '识别身边的“有毒”关系 (测他人)', 
        desc: '<p><b>【测评简介】</b><br>你的TA是否极度自负、缺乏共情？帮你快速识别危险关系。</p><p><b>【如有期待】</b><br>本测试正在开发中，敬请期待。</p>',
        tags: ['关系', '避坑'], 
        price: '1.5', 
        developed: false 
    },
    { 
        id: 'psy_age', 
        title: '心理年龄测试', 
        subtitle: '你的心智比实际年龄成熟吗？', 
        desc: '<p><b>【测评简介】</b><br>测试你的心理成熟度是否与生理年龄匹配。</p><p><b>【如有期待】</b><br>本测试正在开发中，敬请期待。</p>',
        tags: ['趣味', '认知'], 
        price: '1.5', 
        developed: false 
    },
    { 
        id: 'talent', 
        title: '天赋测试', 
        subtitle: '挖掘你被埋没的天生优势', 
        desc: '<p><b>【测评简介】</b><br>找到你的盖洛普优势领域，让努力事半功倍。</p><p><b>【如有期待】</b><br>本测试正在开发中，敬请期待。</p>',
        tags: ['职场', '潜能'], 
        price: '1.5', 
        developed: false 
    },
    { 
        id: 'animal', 
        title: '动物性格测试', 
        subtitle: '你的性格像哪种动物？', 
        desc: '<p><b>【测评简介】</b><br>老虎、孔雀、考拉、猫头鹰，测测你的职场性格原型。</p><p><b>【如有期待】</b><br>本测试正在开发中，敬请期待。</p>',
        tags: ['趣味', '性格'], 
        price: '1.5', 
        developed: false 
    }
];

// 小红书店铺链接
const SHOP_URL = "https://www.xiaohongshu.com/user/profile/601a023b000000000101fb44?xsec_token=YBzfLUaEGC48Kn_H4uNVPPudm5zNIfcyoxvRfnR2VZumo%3D&xsec_source=app_share&xhsshare=&shareRedId=ODYzQTM3N0s2NzUyOTgwNjY0OThKRzo9&apptime=1768918803&share_id=5e6b7913cee843faa97b7b0b9c4eecac&share_channel=copy_link";

// 题目数据 (新版10题，4选项)
const questions = [
    {
        id: 1,
        text: "经常因小事反复胡思乱想，难以平复情绪",
        options: [
            { text: "A·完全不符合", score: 1 },
            { text: "B·偶尔符合", score: 2 },
            { text: "C·比较符合", score: 3 },
            { text: "D·完全符合", score: 4 }
        ]
    },
    {
        id: 2,
        text: "明明未做体力事，却常感身心疲惫、提不起劲",
        options: [
            { text: "A·完全不符合", score: 1 },
            { text: "B·偶尔符合", score: 2 },
            { text: "C·比较符合", score: 3 },
            { text: "D·完全符合", score: 4 }
        ]
    },
    {
        id: 3,
        text: "过度在意他人的看法，害怕被否定或批评",
        options: [
            { text: "A·完全不符合", score: 1 },
            { text: "B·偶尔符合", score: 2 },
            { text: "C·比较符合", score: 3 },
            { text: "D·完全符合", score: 4 }
        ]
    },
    {
        id: 4,
        text: "做事前反复纠结，很难快速做出决定",
        options: [
            { text: "A·完全不符合", score: 1 },
            { text: "B·偶尔符合", score: 2 },
            { text: "C·比较符合", score: 3 },
            { text: "D·完全符合", score: 4 }
        ]
    },
    {
        id: 5,
        text: "独处时容易陷入胡思乱想，情绪低落",
        options: [
            { text: "A·完全不符合", score: 1 },
            { text: "B·偶尔符合", score: 2 },
            { text: "C·比较符合", score: 3 },
            { text: "D·完全符合", score: 4 }
        ]
    },
    {
        id: 6,
        text: "总觉得心里装着事，无法真正放松下来",
        options: [
            { text: "A·完全不符合", score: 1 },
            { text: "B·偶尔符合", score: 2 },
            { text: "C·比较符合", score: 3 },
            { text: "D·完全符合", score: 4 }
        ]
    },
    {
        id: 7,
        text: "容易因他人的一句话，影响一整天的心情",
        options: [
            { text: "A·完全不符合", score: 1 },
            { text: "B·偶尔符合", score: 2 },
            { text: "C·比较符合", score: 3 },
            { text: "D·完全符合", score: 4 }
        ]
    },
    {
        id: 8,
        text: "习惯自我否定，觉得自己不够好",
        options: [
            { text: "A·完全不符合", score: 1 },
            { text: "B·偶尔符合", score: 2 },
            { text: "C·比较符合", score: 3 },
            { text: "D·完全符合", score: 4 }
        ]
    },
    {
        id: 9,
        text: "睡前容易回想过往事，导致入睡困难",
        options: [
            { text: "A·完全不符合", score: 1 },
            { text: "B·偶尔符合", score: 2 },
            { text: "C·比较符合", score: 3 },
            { text: "D·完全符合", score: 4 }
        ]
    },
    {
        id: 10,
        text: "面对选择时，总担心做出错误的决定",
        options: [
            { text: "A·完全不符合", score: 1 },
            { text: "B·偶尔符合", score: 2 },
            { text: "C·比较符合", score: 3 },
            { text: "D·完全符合", score: 4 }
        ]
    }
];

// 结果文案配置 (版本1：温柔共情版 - 动态适配等级)
// 总分范围: 10 - 40
// 轻度: 10-20
// 中度: 21-30
// 重度: 31-40
const results = {
    low: {
        title: "轻度内耗",
        desc: "• 你的情绪调节能力尚可，但偶尔会陷入纠结\n• 对生活保持着敏感度，有时会因此感到疲惫\n• 内心有一片宁静花园，通过简单的自我调适即可恢复",
        advice: "• 每天留10分钟放空时间，不强迫自己思考\n• 保持现在的节奏，多去户外走走，记录生活中的小确幸",
        promoText: "想更了解自己潜在的优势性格吗？",
        promoBtn: "去安安心灵自评馆探索更多"
    },
    mid: {
        title: "中度内耗",
        desc: "• 你习惯把情绪藏在心里，容易自我消耗\n• 对周遭感受敏锐，常因小事牵动情绪\n• 看似平静，内心却一直在反复纠结",
        advice: "• 试着每天给自己10分钟“断网时间”，不看消息，只关注呼吸\n• 接纳自己的情绪，不必事事追求完美",
        promoText: "这种“心累”的感觉，也许与高敏感特质或讨好型人格有关。",
        promoBtn: "去安安心灵自评馆探索更多"
    },
    high: {
        title: "重度内耗",
        desc: "• 你的心理能量正在被大量消耗，大脑像无法关机的电脑\n• 极度在意他人评价，常因害怕犯错而不敢行动\n• 长期处于精神紧绷状态，急需深度放松与疗愈",
        advice: "• 请尝试寻找信任的朋友倾诉，或寻求专业心理咨询师的帮助\n• 允许自己今天“什么都不做”，这没关系",
        promoText: "了解自己的情绪根源是改变的第一步。",
        promoBtn: "去小红书店铺获取支持"
    }
};

// 状态变量
let currentQuestionIndex = 0;
let totalScore = 0;

// DOM 元素
const landingPage = document.getElementById('landing-page');
const quizPage = document.getElementById('quiz-page');
const resultPage = document.getElementById('result-page');
const introPage = document.getElementById('intro-page');

const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const backBtn = document.getElementById('back-btn');

const questionText = document.getElementById('question-text');
const optionsList = document.getElementById('options-list');
const progressBar = document.getElementById('progress-bar');
const currentQSpan = document.getElementById('current-q');
const recommendedList = document.getElementById('recommended-list');

// 页面切换函数
function switchPage(fromPage, toPage) {
    fromPage.classList.remove('active-page');
    fromPage.classList.add('hidden-page');
    
    setTimeout(() => {
        toPage.classList.remove('hidden-page');
        toPage.classList.add('active-page');
        toPage.scrollTop = 0;
    }, 100); 
}

// 初始化测试
function startQuiz() {
    currentQuestionIndex = 0;
    totalScore = 0;
    showQuestion();
    switchPage(landingPage, quizPage);
}

// 显示题目
function showQuestion() {
    const question = questions[currentQuestionIndex];
    
    // 更新进度条
    const progressPercent = ((currentQuestionIndex + 1) / questions.length) * 100;
    progressBar.style.width = `${progressPercent}%`;
    currentQSpan.textContent = currentQuestionIndex + 1;

    // 更新题目内容 (淡入动画)
    questionText.style.opacity = 0;
    setTimeout(() => {
        questionText.textContent = question.text;
        questionText.style.opacity = 1;
    }, 200);

    // 生成选项
    const labels = ['A', 'B', 'C', 'D'];
    optionsList.innerHTML = '';
    question.options.forEach((option, idx) => {
        const btn = document.createElement('div');
        btn.className = 'option-btn';
        btn.setAttribute('data-label', labels[idx]);
        btn.textContent = option.text;
        btn.onclick = () => selectOption(option.score, btn);
        optionsList.appendChild(btn);
    });
}

// 选择选项
function selectOption(score, btnElement) {
    btnElement.classList.add('selected');
    totalScore += score;
    
    setTimeout(() => {
        if (currentQuestionIndex < questions.length - 1) {
            currentQuestionIndex++;
            showQuestion();
        } else {
            showResult();
        }
    }, 300);
}

// 显示结果
function showResult() {
    // 根据总分判定等级 (10-40分)
    let resultKey = 'low';
    if (totalScore >= 21 && totalScore <= 30) {
        resultKey = 'mid';
    } else if (totalScore >= 31) {
        resultKey = 'high';
    }

    const data = results[resultKey];

    document.getElementById('result-title').textContent = data.title;
    
    // 处理多行文本，转为HTML换行
    document.getElementById('result-desc').innerHTML = data.desc.replace(/\n/g, '<br>');
    document.getElementById('result-advice').innerHTML = data.advice.replace(/\n/g, '<br>');
    
    document.getElementById('promo-text').textContent = data.promoText;
    
    const promoBtn = document.getElementById('promo-btn');
    promoBtn.innerHTML = `${data.promoBtn} <span class="small-text">含MBTI、高敏感、恋爱观等</span>`;
    promoBtn.href = SHOP_URL;

    // 显示结果图案
    const icons = { low: '🍃', mid: '☁️', high: '🌧️' };
    const iconEl = document.getElementById('result-icon');
    iconEl.textContent = icons[resultKey];
    iconEl.style.display = 'block';

    renderRecommendedTests();
    switchPage(quizPage, resultPage);
}

// 渲染推荐测试列表
function renderRecommendedTests() {
    recommendedList.innerHTML = '';
    recommendedTests.forEach((test, index) => {
        const card = document.createElement('div');
        card.className = 'rec-card';
        // 添加序号
        const num = index + 1;
        // 如果未开发，添加标记
        const statusBadge = test.developed ? '' : '<span style="font-size:10px; color:#A0AEC0; margin-left:4px;">(开发中)</span>';
        
        card.innerHTML = `
            <div class="rec-header">
                <span class="rec-num">${num}</span>
                <span class="rec-title">${test.title} ${statusBadge}</span>
            </div>
            <div class="rec-desc">${test.subtitle}</div>
            <div class="rec-tags">
                ${test.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
        `;
        
        // 统一交互：点击弹出介绍弹窗
        card.onclick = () => showModal(test);
        
        recommendedList.appendChild(card);
    });
}

// 显示测试介绍页 (统一入口)
function showIntroPage(testData) {
    document.getElementById('intro-title').textContent = testData.title;
    document.getElementById('intro-subtitle').textContent = testData.subtitle;
    document.getElementById('intro-body').innerHTML = testData.desc;
    
    // 渲染标签
    const tagsContainer = document.getElementById('intro-tags');
    tagsContainer.innerHTML = '';
    testData.tags.forEach(tag => {
        const span = document.createElement('div');
        span.className = 'intro-tag';
        span.textContent = tag;
        tagsContainer.appendChild(span);
    });

    const buyBtn = document.getElementById('intro-buy-btn');
    
    // 检查是否需要插入"开发中"提示容器 (单例模式，如果没有就创建)
    let devNotice = document.getElementById('intro-dev-notice');
    if (!devNotice) {
        devNotice = document.createElement('p');
        devNotice.id = 'intro-dev-notice';
        devNotice.style.cssText = "color: #E53E3E; font-size: 14px; margin-bottom: 12px; font-weight: 500;";
        // 插入到按钮之前
        buyBtn.parentNode.insertBefore(devNotice, buyBtn);
    }

    const priceVal = document.getElementById('price-bundle-val');

    if (testData.developed) {
        // 已开发状态：显示"前往测试"
        buyBtn.textContent = "前往测试";
        buyBtn.className = 'buy-btn'; // 重置类名
        buyBtn.classList.remove('btn-xhs'); 
        
        devNotice.style.display = 'none'; // 隐藏提示
        priceVal.textContent = "¥1.5";
        priceVal.classList.remove('text-undeveloped');
    } else {
        // 未开发状态：只显示"关注小红书"
        buyBtn.textContent = "关注小红书";
        buyBtn.className = 'buy-btn btn-xhs'; // 添加小红书风格
        
        devNotice.style.display = 'none';
        
        // 添加警告图标和红色文字 (顺序：价格 -> 图标 -> 文字)
        priceVal.innerHTML = `¥1.5 <span class="warning-icon">!</span> <span class="undeveloped-tip">测试未开发</span>`;
        priceVal.classList.add('text-undeveloped');
    }

    // 两个按钮都指向同一店铺链接
    buyBtn.href = SHOP_URL;

    switchPage(resultPage, introPage);
}

// 事件监听
startBtn.addEventListener('click', startQuiz);
restartBtn.addEventListener('click', () => {
    switchPage(resultPage, landingPage);
});
backBtn.addEventListener('click', () => {
    switchPage(introPage, resultPage);
});

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 确保 landingPage 是 active
    landingPage.classList.add('active-page');
    // 确保其他页面是 hidden
    quizPage.classList.add('hidden-page');
    resultPage.classList.add('hidden-page');
    introPage.classList.add('hidden-page');
});

// 弹窗：打开
function showModal(testData) {
    document.getElementById('modal-title').textContent = testData.title;
    document.getElementById('modal-subtitle').textContent = testData.subtitle;
    document.getElementById('modal-desc').innerHTML = testData.desc;

    const tagsEl = document.getElementById('modal-tags');
    tagsEl.innerHTML = testData.tags.map(t => `<span class="modal-tag">${t}</span>`).join('');

    const btn = document.getElementById('modal-btn');
    if (testData.developed) {
        btn.textContent = '去店铺购买';
        btn.href = SHOP_URL;
        btn.className = 'modal-btn';
    } else {
        btn.textContent = '测试开发中';
        btn.href = '#';
        btn.className = 'modal-btn btn-undeveloped';
    }

    document.getElementById('test-modal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

// 弹窗：关闭
function closeModal(event) {
    if (event && event.target !== document.getElementById('test-modal')) return;
    document.getElementById('test-modal').classList.remove('active');
    document.body.style.overflow = '';
}

