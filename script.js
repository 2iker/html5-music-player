// 平台配置
const platforms = {
    netease: {
        name: '网易云音乐',
        color: '#c20c0c'
    },
    qq: {
        name: 'QQ音乐',
        color: '#31c27c'
    },
    kugou: {
        name: '酷狗音乐',
        color: '#2ca2f5'
    },
    kuwo: {
        name: '酷我音乐',
        color: '#ff6600'
    },
    migu: {
        name: '咪咕音乐',
        color: '#ff3b21'
    }
};

let currentPlatform = 'netease';

// 平台切换
document.querySelectorAll('.tag').forEach(tag => {
    tag.addEventListener('click', function() {
        document.querySelectorAll('.tag').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        currentPlatform = this.dataset.platform;
    });
});

// 搜索功能
async function searchMusic() {
    const keyword = document.getElementById('searchInput').value.trim();
    if (!keyword) {
        alert('请输入搜索内容');
        return;
    }

    const resultDiv = document.getElementById('result');
    const resultList = document.getElementById('resultList');
    resultDiv.classList.remove('hidden');
    resultList.innerHTML = '<div class="loading">搜索中...</div>';

    try {
        // 使用第三方音乐API
        const results = await searchFromAPI(keyword, currentPlatform);
        displayResults(results);
    } catch (error) {
        console.error('搜索失败:', error);
        resultList.innerHTML = '<div class="error">搜索失败，请重试或更换平台</div>';
    }
}

// 调用API搜索
async function searchFromAPI(keyword, platform) {
    // 使用多个免费API源
    const apis = [
        `https://api.lolimi.cn/API/wydg/?msg=${encodeURIComponent(keyword)}&n=10`,
        `https://api.lolimi.cn/API/qqdg/?msg=${encodeURIComponent(keyword)}&n=10`
    ];

    // 根据平台选择API
    let url;
    if (platform === 'netease') {
        url = `https://api.lolimi.cn/API/wydg/?msg=${encodeURIComponent(keyword)}&n=10`;
    } else if (platform === 'qq') {
        url = `https://api.lolimi.cn/API/qqdg/?msg=${encodeURIComponent(keyword)}&n=10`;
    } else {
        // 其他平台使用网易云搜索
        url = `https://api.lolimi.cn/API/wydg/?msg=${encodeURIComponent(keyword)}&n=10`;
    }

    const response = await fetch(url);
    const data = await response.json();

    // 转换为统一格式
    if (data.code === 200 && data.data) {
        return data.data.map(item => ({
            id: item.id || item.songid,
            name: item.name || item.songname,
            artist: item.artist || item.singer,
            album: item.album || '',
            platform: platform
        }));
    }

    // 如果API返回格式不同，尝试解析
    if (Array.isArray(data)) {
        return data.map(item => ({
            id: item.id,
            name: item.name || item.title,
            artist: item.artist || item.author,
            album: item.album || '',
            platform: platform
        }));
    }

    return [];
}

// 显示搜索结果
function displayResults(results) {
    const resultList = document.getElementById('resultList');

    if (!results || results.length === 0) {
        resultList.innerHTML = '<div class="empty">未找到相关歌曲</div>';
        return;
    }

    resultList.innerHTML = results.map((song, index) => `
        <div class="result-item" onclick="selectSong('${song.id}', '${escapeHtml(song.name)}', '${escapeHtml(song.artist)}', '${escapeHtml(song.album)}')">
            <span class="index">${index + 1}</span>
            <div class="song-info">
                <h4>${escapeHtml(song.name)} <span class="id">ID: ${song.id}</span></h4>
                <p>${escapeHtml(song.artist)} ${song.album ? '- ' + escapeHtml(song.album) : ''}</p>
            </div>
            <div class="actions">
                <button class="btn-play" onclick="event.stopPropagation(); selectSong('${song.id}', '${escapeHtml(song.name)}', '${escapeHtml(song.artist)}', '${escapeHtml(song.album)}')">播放</button>
                <button class="btn-download" onclick="event.stopPropagation(); downloadSong('${song.id}')">下载</button>
            </div>
        </div>
    `).join('');
}

// 选择歌曲播放
function selectSong(id, name, artist, album) {
    const platform = platforms[currentPlatform];

    // 根据平台生成播放链接
    let audioUrl;
    if (currentPlatform === 'netease') {
        audioUrl = `http://music.163.com/song/media/outer/url?id=${id}.mp3`;
    } else if (currentPlatform === 'qq') {
        audioUrl = `http://dl.stream.qqmusic.qq.com/C400${id}.m4a?guid=365586308&vkey=&tag=from_newtplayer`;
    } else if (currentPlatform === 'kuwo') {
        audioUrl = `http://antiserver.kuwo.cn/anti.s?rid=MUSIC_${id}&response=res&format=mp3|aac&type=convert_url&br=320kmp3&agent=iPhone`;
    } else {
        audioUrl = `http://music.163.com/song/media/outer/url?id=${id}.mp3`;
    }

    // 显示播放器
    document.getElementById('playerSection').classList.remove('hidden');
    document.getElementById('playerTitle').textContent = name;
    document.getElementById('playerArtist').textContent = `${artist} - ${platform.name}`;
    document.getElementById('playerCover').src = '';

    // 设置音频
    const audio = document.getElementById('audioPlayer');
    audio.src = audioUrl;

    // 设置下载链接
    document.getElementById('downloadBtn').href = audioUrl;
    document.getElementById('downloadBtn').download = `${name} - ${artist}.mp3`;

    // 设置分享链接
    document.getElementById('shareLink').value = audioUrl;

    // 滚动到播放器
    document.getElementById('playerSection').scrollIntoView({ behavior: 'smooth' });
}

// 下载歌曲
function downloadSong(id) {
    selectSong(id, '下载歌曲', '', '');
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

// HTML转义
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// 支持回车键搜索
document.getElementById('searchInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        searchMusic();
    }
});
