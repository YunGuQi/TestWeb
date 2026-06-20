/**
 * 森林潜意识测试逻辑
 */

const app = {
    currentQuestionIndex: 0,
    answers: [],
    
    // 测试题目配置
    questions: [
        {
            text: "你独自走进一片茂密的森林，太阳渐渐下山。此时前方树丛中突然出现一只动物，你直觉它会是什么？",
            options: [
                { id: "A", text: "一只轻盈跳跃的鹿", score: 1 },
                { id: "B", text: "一头默默观察你的狼", score: 2 },
                { id: "C", text: "一只正在觅食的棕熊", score: 3 },
                { id: "D", text: "一只停在枝头的猫头鹰", score: 4 }
            ]
        },
        {
            text: "告别动物后，你继续往前走，在森林深处看到了一座建筑物，它是什么样子的？",
            options: [
                { id: "A", text: "一座破旧但温馨的小木屋", score: 1 },
                { id: "B", text: "一座爬满藤蔓的废弃城堡", score: 2 },
                { id: "C", text: "一座干净明亮的玻璃阳光房", score: 3 },
                { id: "D", text: "一座坚固厚重的石头堡垒", score: 4 }
            ]
        },
        {
            text: "离开建筑物后，你遇到了一条湍急的河流挡住了去路，对岸就是出口。你会怎么过河？",
            options: [
                { id: "A", text: "在附近寻找桥梁或倒下的树干走过去", score: 1 },
                { id: "B", text: "不管那么多了，直接涉水游过去", score: 2 },
                { id: "C", text: "耐心在岸边寻找或制作一艘小船", score: 3 },
                { id: "D", text: "沿着河岸一直走，试图绕开它", score: 4 }
            ]
        }
    ],

    // 结果配置 (基于得分)
    results: [
        {
            minScore: 3,
            maxScore: 6,
            title: "纯真逐梦者",
            desc: "在你的潜意识中，世界是一座充满奇遇的游乐场。你有着孩童般的纯粹和极强的直觉。面对生活中的未知，你总是抱持着善意和好奇。你的内心极其柔软，但也因此容易在复杂的人际关系中感到疲惫。"
        },
        {
            minScore: 7,
            maxScore: 9,
            title: "自由探索家",
            desc: "你的潜意识深处住着一个渴望冲破束缚的灵魂。你对按部就班的生活感到厌倦，内心总有一股冲劲。遇到困难时，你的第一反应往往是迎难而上。你有着极强的适应能力和行动力，但偶尔会因为冲动而忽略细节。"
        },
        {
            minScore: 10,
            maxScore: 12,
            title: "理性守护者",
            desc: "你拥有一个极其成熟且设防的潜意识城堡。你习惯于在行动前权衡利弊，对周围的环境保持着高度的警觉。在他人眼中，你是最可靠的避风港。但这种长期的理性往往让你压抑了自己真实的感性需求。"
        }
    ],

    // 页面跳转
    showPage: function(pageId) {
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        document.getElementById(pageId).classList.add('active');
        window.scrollTo(0, 0);
    },

    // 开始测试
    startTest: function() {
        this.currentQuestionIndex = 0;
        this.answers = [];
        this.renderQuestion();
        this.showPage('page-quiz');
    },

    // 渲染题目
    renderQuestion: function() {
        const q = this.questions[this.currentQuestionIndex];
        
        // 更新进度条
        const progress = ((this.currentQuestionIndex) / this.questions.length) * 100;
        document.getElementById('progress-bar').style.width = `${progress}%`;
        document.getElementById('current-question-num').innerText = this.currentQuestionIndex + 1;
        
        // 渲染文本
        document.getElementById('question-text').innerText = q.text;
        
        // 渲染选项
        const container = document.getElementById('options-container');
        container.innerHTML = '';
        
        q.options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.innerText = opt.text;
            btn.onclick = () => this.selectOption(opt.score);
            container.appendChild(btn);
        });
    },

    // 选择选项
    selectOption: function(score) {
        this.answers.push(score);
        
        if (this.currentQuestionIndex < this.questions.length - 1) {
            this.currentQuestionIndex++;
            // 更新进度条满状态
            const progress = ((this.currentQuestionIndex) / this.questions.length) * 100;
            document.getElementById('progress-bar').style.width = `${progress}%`;
            
            setTimeout(() => {
                this.renderQuestion();
            }, 300); // 留出一点动效时间
        } else {
            // 完成答题
            document.getElementById('progress-bar').style.width = `100%`;
            setTimeout(() => {
                this.calculateResult();
            }, 300);
        }
    },

    // 计算结果
    calculateResult: function() {
        this.showPage('page-loading');
        
        const totalScore = this.answers.reduce((a, b) => a + b, 0);
        let finalResult = this.results[0];
        
        for (let r of this.results) {
            if (totalScore >= r.minScore && totalScore <= r.maxScore) {
                finalResult = r;
                break;
            }
        }
        
        // 模拟网络请求加载感
        setTimeout(() => {
            document.getElementById('result-title').innerText = finalResult.title;
            document.getElementById('result-desc').innerText = finalResult.desc;
            this.showPage('page-result');
        }, 1500);
    }
};

// 初始化
window.onload = () => {
    app.showPage('page-landing');
};
