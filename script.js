// API配置
const API_BASE = 'https://api-enhanced-two-mu.vercel.app';

var player = null;
var playerList = [];
var songsList = [];  // 存储所有歌曲数据
var searchKeyword = '';
var currentPage = 1;
var isLoadMore = false;

// Tab切换
$('#j-nav').on('click', 'li', function() {
    var holder = {
        name: '例如: 不要说话 陈奕迅',
        id: '例如: 25906124',
        url: '例如: https://music.163.com/#/song?id=25906124'
    };
    var filter = $(this).data('filter');
    $(this).addClass('am-active').siblings('li').removeClass('am-active');
    $('#j-input').attr('placeholder', holder[filter]);
});

// 搜索表单提交
$('#j-validator').on('submit', function(e) {
    e.preventDefault();
    searchMusic();
});

// 返回按钮
$('#j-back').on('click', function() {
    if (player) {
        player.pause();
    }
    $('#j-validator').show();
    $('#j-main').hide();
});

// 搜索音乐
async function searchMusic() {
    searchKeyword = $.trim($('#j-input').val());
    if (!searchKeyword) {
        alert('请输入搜索内容');
        return;
    }

    currentPage = 1;
    $('#j-submit').text('搜索中...').prop('disabled', true);

    try {
        var data = await fetchSongs(searchKeyword, currentPage);

        if (data && data.length > 0) {
            // 保存歌曲数据
            songsList = data;

            // 获取歌词
            var lyric = await getLyric(data[0].id);

            // 转换为APlayer格式
            playerList = convertToPlayerList(data, lyric);

            // 显示播放器
            $('#j-validator').hide();
            $('#j-main').show();

            // 更新歌曲信息
            updateSongInfo(data[0], playerList[0].url, lyric);

            // 销毁旧播放器
            if (player) {
                player.destroy();
            }

            // 创建APlayer
            player = new APlayer({
                container: document.getElementById('j-player'),
                mini: false,
                autoplay: false,
                lrcType: 1,
                mutex: true,
                preload: 'auto',
                volume: 0.7,
                listmaxheight: 9999,
                audio: playerList
            });

            // 监听音频加载错误
            player.on('error', function() {
                console.warn('音频加载失败，尝试下一首');
                player.skipForward();
            });

            // 更新歌曲信息的函数
            function updateCurrentSongInfo(index) {
                if (index === undefined) index = player.list.index;
                if (index >= 0 && index < songsList.length) {
                    var song = songsList[index];
                    var artists = song.ar ? song.ar.map(function(a) { return a.name; }).join('/') : '未知';
                    var audioUrl = 'https://music.163.com/song/media/outer/url?id=' + song.id + '.mp3';
                    
                    $('#j-link').val('https://music.163.com/#/song?id=' + song.id);
                    $('#j-link-btn').attr('href', 'https://music.163.com/#/song?id=' + song.id);
                    $('#j-src').val(audioUrl);
                    $('#j-src-btn').attr('href', audioUrl);
                    $('#j-songid').val(song.id);
                    $('#j-name').val(song.name);
                    $('#j-author').val(artists);
                }
            }

            // 监听播放列表切换事件
            player.on('listswitch', function(data) {
                setTimeout(function() {
                    updateCurrentSongInfo(data.index);
                }, 100);
            });

            // 监听播放事件
            player.on('play', function() {
                updateCurrentSongInfo();
            });

            // 初始更新
            updateCurrentSongInfo(0);

            // 添加载入更多按钮
            setTimeout(function() {
                addLoadMoreButton();
            }, 100);
        } else {
            alert('未找到相关歌曲，请换个关键词试试');
        }
    } catch (error) {
        console.error('搜索失败:', error);
        alert('搜索失败: ' + error.message);
    } finally {
        $('#j-submit').text('⚡ 一键搜索').prop('disabled', false);
    }
}

// 获取歌曲列表
async function fetchSongs(keyword, page) {
    var url = API_BASE + '/cloudsearch?keywords=' + encodeURIComponent(keyword) + '&limit=10&type=1&offset=' + ((page - 1) * 10);
    console.log('请求URL:', url);

    var response = await fetch(url);
    var data = await response.json();
    console.log('返回数据:', data);

    if (data.body && data.body.result && data.body.result.songs) {
        return data.body.result.songs;
    } else if (data.result && data.result.songs) {
        return data.result.songs;
    }
    return [];
}

// 转换为APlayer格式
function convertToPlayerList(songs, lyric) {
    var list = [];
    for (var i = 0; i < songs.length; i++) {
        var song = songs[i];
        var artists = song.ar ? song.ar.map(function(a) { return a.name; }).join('/') : '未知';
        var picUrl = song.al && song.al.picUrl ? song.al.picUrl : '';
        // 将http改为https
        if (picUrl && picUrl.startsWith('http://')) {
            picUrl = picUrl.replace('http://', 'https://');
        }
        var audioUrl = 'https://music.163.com/song/media/outer/url?id=' + song.id + '.mp3';

        list.push({
            name: song.name,
            artist: artists,
            url: audioUrl,
            cover: picUrl || 'https://p1.music.126.net/OdGMEPNgtU3B5F-Gc6yN_A==/109951167657874880.jpg',
            lrc: i === 0 ? lyric : ''
        });
    }
    return list;
}

// 载入更多
async function loadMore() {
    if (isLoadMore) return;
    isLoadMore = true;
    currentPage++;

    // 显示加载中
    $('#j-more').text('加载中...').css('pointer-events', 'none');

    // 保存当前滚动位置
    var list = $('.aplayer-list')[0];
    var scrollPos = list ? list.scrollTop : 0;

    try {
        var data = await fetchSongs(searchKeyword, currentPage);

        if (data && data.length > 0) {
            // 保存歌曲数据
            songsList = songsList.concat(data);

            // 直接在ol中添加新的li
            var ol = $('.aplayer-list ol');
            var startIndex = playerList.length;

            for (var i = 0; i < data.length; i++) {
                var song = data[i];
                var artists = song.ar ? song.ar.map(function(a) { return a.name; }).join('/') : '未知';

                // 构建li元素
                var li = $('<li>' +
                    '<span class="aplayer-list-cur" style="background-color: rgb(14, 144, 210);"></span>' +
                    '<span class="aplayer-list-index">' + (startIndex + i + 1) + '</span>' +
                    '<span class="aplayer-list-title">' + song.name + '</span>' +
                    '<span class="aplayer-list-author">' + artists + '</span>' +
                    '</li>');
                ol.append(li);

                // 添加到播放列表数据
                var picUrl = song.al && song.al.picUrl ? song.al.picUrl : '';
                // 将http改为https
                if (picUrl && picUrl.startsWith('http://')) {
                    picUrl = picUrl.replace('http://', 'https://');
                }
                playerList.push({
                    name: song.name,
                    artist: artists,
                    url: 'https://music.163.com/song/media/outer/url?id=' + song.id + '.mp3',
                    cover: picUrl || 'https://p1.music.126.net/OdGMEPNgtU3B5F-Gc6yN_A==/109951167657874880.jpg',
                    lrc: ''
                });
            }

            // 使用requestAnimationFrame恢复滚动位置
            requestAnimationFrame(function() {
                requestAnimationFrame(function() {
                    list.scrollTop = scrollPos;
                });
            });

            // 更新按钮状态
            if (data.length < 10) {
                $('#j-more').text('没有了').css('pointer-events', 'none');
            } else {
                $('#j-more').text('载入更多（无法播放请换一个试试）').css('pointer-events', 'auto');
            }
        } else {
            $('#j-more').text('没有了').css('pointer-events', 'none');
        }
    } catch (error) {
        console.error('载入更多失败:', error);
        $('#j-more').text('加载失败，点击重试').css('pointer-events', 'auto');
    } finally {
        isLoadMore = false;
    }
}

// 添加载入更多按钮
function addLoadMoreButton() {
    $('#j-more').show();
    $('#j-more').off('click').on('click', function() {
        loadMore();
    });
}

// 更新歌曲信息
function updateSongInfo(song, audioUrl, lyric) {
    var artists = song.ar ? song.ar.map(function(a) { return a.name; }).join('/') : '未知';
    $('#j-link').val('https://music.163.com/#/song?id=' + song.id);
    $('#j-link-btn').attr('href', 'https://music.163.com/#/song?id=' + song.id);
    $('#j-src').val(audioUrl);
    $('#j-src-btn').attr('href', audioUrl);
    $('#j-songid').val(song.id);
    $('#j-name').val(song.name);
    $('#j-author').val(artists);
    $('#j-lrc').val(lyric.substring(0, 50) + '...');

    // 生成歌词下载链接
    window.currentLyric = lyric;
    window.currentSongName = song.name;
    window.currentArtistName = artists;
    $('#j-lrc-btn').off('click').on('click', function(e) {
        e.preventDefault();
        var lrcContent = window.currentLyric;
        var blob = new Blob([lrcContent], { type: 'text/plain;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = window.currentSongName + '-' + window.currentArtistName + '.lrc';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
}

// 获取歌词
async function getLyric(id) {
    try {
        var url = API_BASE + '/lyric?id=' + id;
        var response = await fetch(url);
        var data = await response.json();

        if (data.code === 200 && data.lrc && data.lrc.lyric) {
            return data.lrc.lyric;
        }
        return '暂无歌词';
    } catch (error) {
        console.error('获取歌词失败:', error);
        return '暂无歌词';
    }
}

// 支持回车键搜索
$('#j-input').on('keypress', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        searchMusic();
    }
});
