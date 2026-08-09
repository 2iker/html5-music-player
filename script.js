// API配置
const API_BASE = 'https://api-enhanced-two-mu.vercel.app';

let player = null;
let playerList = [];
let songsList = [];
let searchKeyword = '';
let currentPage = 1;
let isLoadMore = false;

// 搜索音乐
async function searchMusic() {
    const keyword = document.getElementById('searchInput').value.trim();
    if (!keyword) {
        alert('请输入搜索内容');
        return;
    }

    searchKeyword = keyword;
    currentPage = 1;

    const searchBtn = document.getElementById('searchBtn');
    searchBtn.innerHTML = '<span class="loading"></span>';
    searchBtn.disabled = true;

    try {
        const data = await fetchSongs(keyword, currentPage);

        if (data && data.length > 0) {
            songsList = data;
            playerList = convertToPlayerList(data);

            // 创建播放器
            createPlayer(data);

            // 切换界面
            document.getElementById('searchSection').classList.add('hidden');
            document.getElementById('playerSection').classList.remove('hidden');
        } else {
            alert('未找到相关歌曲');
        }
    } catch (error) {
        console.error('搜索失败:', error);
        alert('搜索失败，请重试');
    } finally {
        searchBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path></svg>`;
        searchBtn.disabled = false;
    }
}

// 创建播放器
function createPlayer(songs) {
    const firstSong = songs[0];
    const artists = firstSong.ar ? firstSong.ar.map(a => a.name).join('/') : '未知';

    // 更新歌曲信息
    updateSongInfo(firstSong, artists);

    // 销毁旧播放器
    if (player) {
        player.destroy();
    }

    // 创建新播放器（使用所有歌曲）
    player = new APlayer({
        container: document.getElementById('aplayer'),
        mini: false,
        autoplay: true,
        lrcType: 1,
        mutex: true,
        preload: 'auto',
        volume: 0.7,
        listmaxheight: 9999,
        audio: playerList
    });

    // 监听歌曲切换
    player.on('listswitch', function(data) {
        if (data.index >= 0 && data.index < songsList.length) {
            const song = songsList[data.index];
            const artists = song.ar ? song.ar.map(a => a.name).join('/') : '未知';
            updateSongInfo(song, artists);
        }
    });

    player.on('play', function() {
        const index = player.list.index;
        if (index >= 0 && index < songsList.length) {
            const song = songsList[index];
            const artists = song.ar ? song.ar.map(a => a.name).join('/') : '未知';
            updateSongInfo(song, artists);
        }
    });

    // 错误处理
    let errorCount = 0;
    player.on('error', function() {
        errorCount++;
        if (errorCount <= 3) {
            showNotice('该歌曲暂时无法播放，正在播放下一首');
        }
        player.skipForward();
        setTimeout(() => player.play(), 300);
    });

    player.on('canplay', () => errorCount = 0);
}

// 更新歌曲信息
function updateSongInfo(song, artists) {
    const audioUrl = `https://music.163.com/song/media/outer/url?id=${song.id}.mp3`;

    document.getElementById('songTitle').textContent = song.name;
    document.getElementById('songArtist').textContent = artists;
    document.getElementById('songId').textContent = song.id;
    document.getElementById('songLink').href = `https://music.163.com/#/song?id=${song.id}`;
    document.getElementById('songUrl').value = audioUrl;
    document.getElementById('downloadBtn').href = audioUrl;
    document.getElementById('downloadBtn').download = `${song.name} - ${artists}.mp3`;
}

// 获取歌曲列表
async function fetchSongs(keyword, page) {
    const url = `${API_BASE}/cloudsearch?keywords=${encodeURIComponent(keyword)}&limit=10&type=1&offset=${(page - 1) * 10}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.body && data.body.result && data.body.result.songs) {
        return data.body.result.songs;
    } else if (data.result && data.result.songs) {
        return data.result.songs;
    }
    return [];
}

// 转换为APlayer格式
function convertToPlayerList(songs) {
    return songs.map(song => {
        const artists = song.ar ? song.ar.map(a => a.name).join('/') : '未知';
        let picUrl = song.al && song.al.picUrl ? song.al.picUrl : '';
        if (picUrl.startsWith('http://')) picUrl = picUrl.replace('http://', 'https://');

        return {
            name: song.name,
            artist: artists,
            url: `https://music.163.com/song/media/outer/url?id=${song.id}.mp3`,
            cover: picUrl || 'https://p1.music.126.net/OdGMEPNgtU3B5F-Gc6yN_A==/109951167657874880.jpg'
        };
    });
}

// 载入更多
async function loadMore() {
    if (isLoadMore) return;
    isLoadMore = true;
    currentPage++;

    const btn = document.getElementById('loadMoreBtn');
    btn.textContent = '加载中...';
    btn.disabled = true;

    try {
        const data = await fetchSongs(searchKeyword, currentPage);

        if (data && data.length > 0) {
            songsList = songsList.concat(data);
            const newMusicList = convertToPlayerList(data);

            // 使用APlayer的add方法添加歌曲
            newMusicList.forEach(music => {
                player.list.add(music);
            });

            if (data.length < 10) {
                btn.textContent = '没有更多了';
                btn.disabled = true;
            } else {
                btn.textContent = '载入更多';
                btn.disabled = false;
            }
        } else {
            btn.textContent = '没有更多了';
            btn.disabled = true;
        }
    } catch (error) {
        console.error('加载失败:', error);
        btn.textContent = '加载失败，点击重试';
        btn.disabled = false;
    } finally {
        isLoadMore = false;
    }
}

// 返回搜索
function backToSearch() {
    if (player) player.pause();
    document.getElementById('searchSection').classList.remove('hidden');
    document.getElementById('playerSection').classList.add('hidden');
}

// 复制链接
function copyUrl(url) {
    navigator.clipboard.writeText(url).then(() => {
        showNotice('链接已复制');
    }).catch(() => {
        const input = document.createElement('input');
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        showNotice('链接已复制');
    });
}

// 显示提示
function showNotice(text) {
    const notice = document.getElementById('notice');
    notice.textContent = text;
    notice.classList.remove('hidden');
    setTimeout(() => notice.classList.add('hidden'), 2000);
}

// 回车搜索
document.getElementById('searchInput').addEventListener('keypress', e => {
    if (e.key === 'Enter') {
        e.preventDefault();
        searchMusic();
    }
});
