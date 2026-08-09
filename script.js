// 当前配置
let currentTab = 'name';
let currentPlatform = 'netease';

// 平台配置
const platforms = {
    netease: {
        name: '网易云音乐',
        // 搜索API（需要后端代理，这里用外链方式）
        searchUrl: (keyword) => `https://music.163.com/#/search/m/?s=${encodeURIComponent(keyword)}&type=1`,
        getUrl: (id) => `http://music.163.com/song/media/outer/url?id=${id}.mp3`,
        parseId: (input) => {
            const match = input.match(/id=(\d+)/);
            return match ? match[1] : input.trim();
        }
    },
    qq: {
        name: 'QQ音乐',
        searchUrl: (keyword) => `https://y.qq.com/n/ryqq/search?w=${encodeURIComponent(keyword)}`,
        getUrl: (id) => `http://dl.stream.qqmusic.qq.com/C400${id}.m4a?guid=365586308&vkey=&tag=from_newtplayer`,
        parseId: (input) => {
            const match = input.match(/\/([A-Za-z0-9]+)\.html/) || input.match(/song\/([A-Za-z0-9]+)/);
            return match ? match[1] : input.trim();
        }
    },
    kugou: {
        name: '酷狗音乐',
        searchUrl: (keyword) => `https://www.kugou.com/yy/html/search.html#searchType=song&searchKeyWord=${encodeURIComponent(keyword)}`,
        getUrl: (id) => `http://trackercdn.kugou.com/i/v2/?cmd=25&pid=1&behavior=play&hash=${id}`,
        parseId: (input) => {
            const match = input.match(/hash=([a-f0-9]+)/i);
            return match ? match[1] : input.trim();
        }
    },
    kuwo: {
        name: '酷我音乐',
        searchUrl: (keyword) => `https://www.kuwo.cn/search/list?key=${encodeURIComponent(keyword)}`,
        getUrl: (id) => `http://antiserver.kuwo.cn/anti.s?rid=MUSIC_${id}&response=res&format=mp3|aac&type=convert_url&br=320kmp3&agent=iPhone`,
        parseId: (input) => {
            const match = input.match(/id=(\d+)/) || input.match(/\/(\d+)/);
            return match ? match[1] : input.trim();
        }
    },
    migu: {
        name: '咪咕音乐',
        searchUrl: (keyword) => `https://music.migu.cn/v3/music/search?keyword=${encodeURIComponent(keyword)}`,
        getUrl: (id) => `https://app.c.nf.migu.cn/MIGUM2.0/strategy/listen-url/v2.2?netType=01&resourceType=E&songId=${id}&toneFlag=LQ`,
        parseId: (input) => {
            const match = input.match(/id=(\d+)/) || input.match(/song\/(\d+)/);
            return match ? match[1] : input.trim();
        }
    }
};

// 标签切换
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        currentTab = this.dataset.tab;
        updatePlaceholder();
    });
});

// 平台切换
document.querySelectorAll('.tag').forEach(tag => {
    tag.addEventListener('click', function() {
        document.querySelectorAll('.tag').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        currentPlatform = this.dataset.platform;
        updatePlaceholder();
    });
});

// 更新输入框提示
function updatePlaceholder() {
    const input = document.getElementById('searchInput');
    const hints = {
        name: '请输入音乐名称',
        id: '请输入音乐ID',
        url: '请输入音乐链接'
    };
    input.placeholder = hints[currentTab];
}

// 填入示例
function fillExample(text) {
    document.getElementById('searchInput').value = text;
    searchMusic();
}

// 搜索音乐
function searchMusic() {
    const keyword = document.getElementById('searchInput').value.trim();
    if (!keyword) {
        alert('请输入搜索内容');
        return;
    }

    const platform = platforms[currentPlatform];

    if (currentTab === 'name') {
        // 名称搜索 - 跳转到对应平台搜索
        window.open(platform.searchUrl(keyword), '_blank');
    } else if (currentTab === 'id') {
        // ID解析 - 直接解析
        const songId = platform.parseId(keyword);
        if (songId) {
            playMusic(songId, '未知歌曲', '未知歌手', '');
        } else {
            alert('无法识别ID，请检查输入');
        }
    } else if (currentTab === 'url') {
        // 链接解析
        parseUrl(keyword);
    }
}

// 解析链接
function parseUrl(url) {
    // 网易云
    const neteaseMatch = url.match(/music\.163\.com.*id=(\d+)/);
    if (neteaseMatch) {
        currentPlatform = 'netease';
        playMusic(neteaseMatch[1], '网易云音乐歌曲', '未知歌手', '');
        return;
    }

    // QQ音乐
    const qqMatch = url.match(/y\.qq\.com.*\/([A-Za-z0-9]+)\.html/);
    if (qqMatch) {
        currentPlatform = 'qq';
        playMusic(qqMatch[1], 'QQ音乐歌曲', '未知歌手', '');
        return;
    }

    // 酷狗
    const kugouMatch = url.match(/hash=([a-f0-9]+)/i);
    if (kugouMatch) {
        currentPlatform = 'kugou';
        playMusic(kugouMatch[1], '酷狗音乐歌曲', '未知歌手', '');
        return;
    }

    // 酷我
    const kuwoMatch = url.match(/kuwo\.cn.*?(\d+)/);
    if (kuwoMatch) {
        currentPlatform = 'kuwo';
        playMusic(kuwoMatch[1], '酷我音乐歌曲', '未知歌手', '');
        return;
    }

    alert('无法识别链接，请检查输入');
}

// 播放音乐
function playMusic(songId, title, artist, cover) {
    const platform = platforms[currentPlatform];
    const url = platform.getUrl(songId);

    // 显示播放器
    document.getElementById('playerSection').classList.remove('hidden');
    document.getElementById('playerTitle').textContent = title;
    document.getElementById('playerArtist').textContent = `${platform.name} - ID: ${songId}`;
    document.getElementById('playerCover').src = cover || '';

    // 设置音频
    const audio = document.getElementById('audioPlayer');
    audio.src = url;

    // 设置下载链接
    document.getElementById('downloadBtn').href = url;

    // 设置分享链接
    document.getElementById('shareLink').value = url;

    // 滚动到播放器
    document.getElementById('playerSection').scrollIntoView({ behavior: 'smooth' });
}

// 复制链接
function copyLink() {
    const linkInput = document.getElementById('shareLink');
    linkInput.select();
    document.execCommand('copy');

    const btn = document.querySelector('.btn-copy');
    const originalText = btn.textContent;
    btn.textContent = '已复制!';
    setTimeout(() => {
        btn.textContent = originalText;
    }, 2000);
}

// 清空结果
function clearResults() {
    document.getElementById('result').classList.add('hidden');
    document.getElementById('playerSection').classList.add('hidden');
}

// 支持回车键搜索
document.getElementById('searchInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        searchMusic();
    }
});

// 初始化
updatePlaceholder();
