// API配置
const API_BASE = 'https://api-enhanced-two-mu.vercel.app';

// 平台配置
const platforms = {
    netease: {
        name: '网易云音乐',
        type: 'netease'
    },
    qq: {
        name: 'QQ音乐',
        type: 'qq'
    },
    kugou: {
        name: '酷狗音乐',
        type: 'kugou'
    },
    kuwo: {
        name: '酷我音乐',
        type: 'kuwo'
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
        const platform = platforms[currentPlatform];
        const url = `${API_BASE}/api/search?keyword=${encodeURIComponent(keyword)}&type=${platform.type}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.code === 200 && data.data && data.data.length > 0) {
            displayResults(data.data);
        } else {
            resultList.innerHTML = '<div class="empty">未找到相关歌曲</div>';
        }
    } catch (error) {
        console.error('搜索失败:', error);
        resultList.innerHTML = '<div class="error">搜索失败，请重试</div>';
    }
}

// 显示搜索结果
function displayResults(songs) {
    const resultList = document.getElementById('resultList');

    if (!songs || songs.length === 0) {
        resultList.innerHTML = '<div class="empty">未找到相关歌曲</div>';
        return;
    }

    resultList.innerHTML = songs.map((song, index) => `
        <div class="result-item">
            <span class="index">${index + 1}</span>
            <div class="song-info">
                <h4>${escapeHtml(song.name)} <span class="id">ID: ${song.id}</span></h4>
                <p>${escapeHtml(song.artist)} ${song.album ? '- ' + escapeHtml(song.album) : ''}</p>
            </div>
            <div class="actions">
                <button class="btn-play" onclick="playSong('${song.url}', '${escapeHtml(song.name)}', '${escapeHtml(song.artist)}')">播放</button>
                <a class="btn-download" href="${song.url}" download="${escapeHtml(song.name)} - ${escapeHtml(song.artist)}.mp3">下载</a>
                <button class="btn-copy" onclick="copyUrl('${song.url}')">复制</button>
            </div>
        </div>
    `).join('');
}

// 播放歌曲
function playSong(url, name, artist) {
    const platform = platforms[currentPlatform];

    // 显示播放器
    document.getElementById('playerSection').classList.remove('hidden');
    document.getElementById('playerTitle').textContent = name;
    document.getElementById('playerArtist').textContent = `${artist} - ${platform.name}`;

    // 设置音频
    const audio = document.getElementById('audioPlayer');
    audio.src = url;
    audio.play();

    // 设置下载链接
    document.getElementById('downloadBtn').href = url;
    document.getElementById('downloadBtn').download = `${name} - ${artist}.mp3`;

    // 设置分享链接
    document.getElementById('shareLink').value = url;

    // 滚动到播放器
    document.getElementById('playerSection').scrollIntoView({ behavior: 'smooth' });
}

// 复制链接
function copyUrl(url) {
    navigator.clipboard.writeText(url).then(() => {
        alert('链接已复制！');
    }).catch(() => {
        const input = document.createElement('input');
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        alert('链接已复制！');
    });
}

// 复制分享链接
function copyLink() {
    const linkInput = document.getElementById('shareLink');
    copyUrl(linkInput.value);
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
        e.preventDefault();
        searchMusic();
    }
});
