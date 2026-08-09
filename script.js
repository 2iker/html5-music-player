// API配置
const API_BASE = 'https://api-enhanced-two-mu.vercel.app';

let currentPlatform = 'netease';
let ap = null;

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
        const url = `${API_BASE}/search?keywords=${encodeURIComponent(keyword)}&limit=10`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.code === 200 && data.result && data.result.songs) {
            displayResults(data.result.songs);
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

    resultList.innerHTML = songs.map((song, index) => {
        const artists = song.artists ? song.artists.map(a => a.name).join('/') : '未知';
        const album = song.album ? song.album.name : '';
        const picUrl = song.album && song.album.picUrl ? song.album.picUrl : '';
        return `
        <div class="result-item">
            <span class="index">${index + 1}</span>
            <div class="song-info">
                <h4>${escapeHtml(song.name)} <span class="id">ID: ${song.id}</span></h4>
                <p>${escapeHtml(artists)} ${album ? '- ' + escapeHtml(album) : ''}</p>
            </div>
            <div class="actions">
                <button class="btn-play" onclick='playSong(${JSON.stringify(song).replace(/'/g, "\\'")})'>播放</button>
                <button class="btn-copy" onclick="copyUrl('http://music.163.com/song/media/outer/url?id=${song.id}.mp3')">复制</button>
            </div>
        </div>
    `;
    }).join('');
}

// 获取歌曲播放链接
async function getSongUrl(id) {
    try {
        const url = `${API_BASE}/song/url/v1?id=${id}&level=exhigh`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.code === 200 && data.data && data.data[0] && data.data[0].url) {
            return data.data[0].url;
        }
        return `http://music.163.com/song/media/outer/url?id=${id}.mp3`;
    } catch (error) {
        console.error('获取播放链接失败:', error);
        return `http://music.163.com/song/media/outer/url?id=${id}.mp3`;
    }
}

// 播放歌曲
async function playSong(song) {
    const artists = song.artists ? song.artists.map(a => a.name).join('/') : '未知';
    const album = song.album ? song.album.name : '';
    const picUrl = song.album && song.album.picUrl ? song.album.picUrl : '';

    // 获取播放链接
    const audioUrl = await getSongUrl(song.id);

    // 显示播放器
    document.getElementById('playerSection').classList.remove('hidden');

    // 销毁旧的播放器
    if (ap) {
        ap.destroy();
    }

    // 创建APlayer
    ap = new APlayer({
        container: document.getElementById('aplayer'),
        mini: false,
        autoplay: true,
        lrcType: 0,
        mutex: true,
        preload: 'auto',
        volume: 0.7,
        audio: [{
            name: song.name,
            artist: artists,
            url: audioUrl,
            cover: picUrl || 'https://p1.music.126.net/OdGMEPNgtU3B5F-Gc6yN_A==/109951167657874880.jpg',
            lrc: ''
        }]
    });

    // 设置下载链接
    document.getElementById('downloadBtn').href = audioUrl;
    document.getElementById('downloadBtn').download = `${song.name} - ${artists}.mp3`;

    // 设置分享链接
    document.getElementById('shareLink').value = audioUrl;

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
