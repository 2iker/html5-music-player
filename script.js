// API配置
const API_BASE = 'https://api-enhanced-two-mu.vercel.app';

let player = null;
let playerList = [];
let songsList = [];
let searchKeyword = '';
let currentPage = 1;
let isLoadMore = false;
let noMore = false;

// 创建播放器
function createPlayer(songs) {
    const firstSong = songs[0];
    const artists = firstSong.ar ? firstSong.ar.map(a => a.name).join('/') : '未知';
    const audioUrl = `https://music.163.com/song/media/outer/url?id=${firstSong.id}.mp3`;

    // 更新歌曲信息
    updateSongInfo(firstSong, artists, audioUrl);

    // 销毁旧播放器
    if (player) {
        player.destroy();
    }

    // 创建新播放器
    player = new APlayer({
        container: document.getElementById('j-player'),
        mini: false,
        autoplay: true,
        lrcType: 1,
        mutex: true,
        preload: 'auto',
        volume: 0.7,
        theme: '#7f8c9d',
        listmaxheight: 9999,
        audio: playerList
    });

    // 监听歌曲切换
    player.on('listswitch', function(data) {
        if (data.index >= 0 && data.index < songsList.length) {
            const song = songsList[data.index];
            const artists = song.ar ? song.ar.map(a => a.name).join('/') : '未知';
            const audioUrl = `https://music.163.com/song/media/outer/url?id=${song.id}.mp3`;
            updateSongInfo(song, artists, audioUrl);
        }
    });

    player.on('play', function() {
        const index = player.list.index;
        if (index >= 0 && index < songsList.length) {
            const song = songsList[index];
            const artists = song.ar ? song.ar.map(a => a.name).join('/') : '未知';
            const audioUrl = `https://music.163.com/song/media/outer/url?id=${song.id}.mp3`;
            updateSongInfo(song, artists, audioUrl);
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
function updateSongInfo(song, artists, audioUrl) {
    document.getElementById('j-link').value = `https://music.163.com/#/song?id=${song.id}`;
    document.getElementById('j-link-btn').href = `https://music.163.com/#/song?id=${song.id}`;
    document.getElementById('j-src').value = audioUrl;
    document.getElementById('j-src-btn').href = audioUrl;
    document.getElementById('j-songid').value = song.id;
    document.getElementById('j-name').value = song.name;
    document.getElementById('j-author').value = artists;
    
    // 获取歌词
    getLyric(song.id);
}

// 获取歌词
async function getLyric(id) {
    try {
        const response = await fetch(`${API_BASE}/lyric?id=${id}`);
        const data = await response.json();
        if (data.lrc && data.lrc.lyric) {
            document.getElementById('j-lrc').value = data.lrc.lyric.substring(0, 50) + '...';
            
            // 生成歌词下载链接
            const lrcContent = data.lrc.lyric;
            const blob = new Blob([lrcContent], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            document.getElementById('j-lrc-btn').href = url;
            document.getElementById('j-lrc-btn').download = 'lyrics.lrc';
        }
    } catch (error) {
        console.error('获取歌词失败:', error);
    }
}

// 获取歌曲列表
async function fetchSongs(keyword, page) {
    const url = `${API_BASE}/cloudsearch?keywords=${encodeURIComponent(keyword)}&limit=10&type=1&offset=${(page - 1) * 10}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);

    try {
        const response = await fetch(url, { signal: controller.signal });
        const data = await response.json();

        if (data.body && data.body.result && data.body.result.songs) {
            return data.body.result.songs;
        } else if (data.result && data.result.songs) {
            return data.result.songs;
        }
        return [];
    } finally {
        clearTimeout(timer);
    }
}

// 转换为APlayer格式
async function convertToPlayerList(songs) {
    const withTimeout = (promise, ms) =>
        Promise.race([
            promise,
            new Promise(resolve => setTimeout(() => resolve(''), ms))
        ]);

    const lrcResults = await Promise.all(songs.map(song =>
        withTimeout(
            fetch(`${API_BASE}/lyric?id=${song.id}`)
                .then(res => res.json())
                .then(data => (data.lrc && data.lrc.lyric) ? data.lrc.lyric : '')
                .catch(() => ''),
            8000
        )
    ));

    return songs.map((song, i) => {
        const artists = song.ar ? song.ar.map(a => a.name).join('/') : '未知';
        let picUrl = song.al && song.al.picUrl ? song.al.picUrl : '';
        if (picUrl.startsWith('http://')) picUrl = picUrl.replace('http://', 'https://');

        const lrc = lrcResults[i];
        const safeLrc = (lrc && lrc.trim())
            ? lrc
            : '[00:00.00]暂无歌词';

        return {
            name: song.name,
            artist: artists,
            url: `https://music.163.com/song/media/outer/url?id=${song.id}.mp3`,
            cover: picUrl || 'https://p1.music.126.net/OdGMEPNgtU3B5F-Gc6yN_A==/109951167657874880.jpg',
            lrc: safeLrc
        };
    });
}

// 载入更多
async function loadMore() {
    if (isLoadMore || noMore) return;
    isLoadMore = true;
    currentPage++;

    const btn = document.getElementById('loadMoreBtn');
    btn.textContent = '加载中...';
    btn.disabled = true;

    try {
        const data = await fetchSongs(searchKeyword, currentPage);

        if (data && data.length > 0) {
            songsList = songsList.concat(data);
            const newMusicList = await convertToPlayerList(data);

            // 使用APlayer的add方法添加歌曲
            newMusicList.forEach(music => {
                player.list.add(music);
            });

            if (data.length < 10) {
                noMore = true;
                btn.textContent = '没有更多了';
            } else {
                btn.textContent = '载入更多';
                btn.disabled = false;
            }
        } else {
            noMore = true;
            btn.textContent = '没有更多了';
        }
    } catch (error) {
        console.error('加载失败:', error);
        btn.textContent = '加载失败，点击重试';
        btn.disabled = false;
    } finally {
        isLoadMore = false;
    }
}

// 结果页搜索
async function searchMusic2() {
    searchKeyword = document.getElementById('searchInput2').value.trim();
    if (!searchKeyword) {
        showNotice('请输入搜索内容');
        return;
    }

    currentPage = 1;
    const searchBtn = document.getElementById('searchBtn2');
    searchBtn.classList.add('loading');
    searchBtn.disabled = true;

    try {
        const data = await fetchSongs(searchKeyword, currentPage);

        if (data && data.length > 0) {
            songsList = data;
            playerList = await convertToPlayerList(data);

            // 先显示结果面板，再创建播放器（APlayer 需要容器可见才能正常初始化）
            document.getElementById('j-main').classList.remove('hidden');
            document.getElementById('githubLink').classList.add('hidden');

            // 创建播放器
            createPlayer(data);

            // 更新载入更多按钮
            document.getElementById('loadMoreBtn').classList.remove('hidden');
            noMore = false;
            document.getElementById('loadMoreBtn').textContent = '载入更多';
        } else {
            showNotice('未找到相关歌曲');
        }
    } catch (error) {
        console.error('搜索失败:', error);
        showNotice('搜索失败，请重试');
    } finally {
        searchBtn.classList.remove('loading');
        searchBtn.disabled = false;
    }
}

// 显示提示
function showNotice(text) {
    const notice = document.getElementById('notice');
    notice.textContent = text;
    notice.classList.remove('hidden');
    setTimeout(() => notice.classList.add('hidden'), 2000);
}

// 结果页回车搜索
document.getElementById('searchInput2').addEventListener('keypress', e => {
    if (e.key === 'Enter') {
        e.preventDefault();
        searchMusic2();
    }
});
