const { createApp, ref, onMounted } = Vue;

const API_BASE = 'https://api-enhanced-two-mu.vercel.app';

createApp({
    setup() {
        // 响应式数据
        const searchKeyword = ref('');
        const loading = ref(false);
        const loadingMore = ref(false);
        const showPlayer = ref(false);
        const showLoadMore = ref(false);
        const noMore = ref(false);
        const notice = ref('');
        
        let player = null;
        let playerList = [];
        let songsList = [];
        let currentPage = 1;

        // 搜索音乐
        async function search() {
            const keyword = searchKeyword.value.trim();
            if (!keyword) {
                alert('请输入搜索内容');
                return;
            }

            currentPage = 1;
            loading.value = true;

            try {
                const data = await fetchSongs(keyword, currentPage);

                if (data && data.length > 0) {
                    songsList = data;
                    playerList = convertToPlayerList(data);

                    // 创建播放器
                    createPlayer(data);

                    // 显示播放器
                    showPlayer.value = true;
                    showLoadMore.value = true;
                    noMore.value = false;
                } else {
                    alert('未找到相关歌曲');
                }
            } catch (error) {
                console.error('搜索失败:', error);
                alert('搜索失败，请重试');
            } finally {
                loading.value = false;
            }
        }

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
            if (loadingMore.value || noMore.value) return;
            loadingMore.value = true;
            currentPage++;

            try {
                const data = await fetchSongs(searchKeyword.value, currentPage);

                if (data && data.length > 0) {
                    songsList = songsList.concat(data);
                    const newMusicList = convertToPlayerList(data);

                    // 使用APlayer的add方法添加歌曲
                    newMusicList.forEach(music => {
                        player.list.add(music);
                    });

                    if (data.length < 10) {
                        noMore.value = true;
                    }
                } else {
                    noMore.value = true;
                }
            } catch (error) {
                console.error('加载失败:', error);
            } finally {
                loadingMore.value = false;
            }
        }

        // 返回搜索
        function backToSearch() {
            if (player) player.pause();
            showPlayer.value = false;
            showLoadMore.value = false;
        }

        // 显示提示
        function showNotice(text) {
            notice.value = text;
            setTimeout(() => {
                notice.value = '';
            }, 2000);
        }

        return {
            searchKeyword,
            loading,
            loadingMore,
            showPlayer,
            showLoadMore,
            noMore,
            notice,
            search,
            loadMore,
            backToSearch
        };
    }
}).mount('#app');
