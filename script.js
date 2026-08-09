// API配置
const API_BASE = 'https://api-enhanced-two-mu.vercel.app';

var player = null;
var playerList = [];
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
                autoplay: true,
                lrcType: 1,
                mutex: true,
                preload: 'auto',
                volume: 0.7,
                audio: playerList
            });

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

    try {
        var data = await fetchSongs(searchKeyword, currentPage);

        if (data && data.length > 0) {
            var newMusicList = convertToPlayerList(data, '');

            // 重新创建播放器，添加新歌曲
            var allAudio = playerList.concat(newMusicList);
            playerList = allAudio;

            // 销毁旧播放器
            if (player) {
                player.destroy();
            }

            // 创建新播放器
            player = new APlayer({
                container: document.getElementById('j-player'),
                mini: false,
                autoplay: false,
                lrcType: 1,
                mutex: true,
                preload: 'auto',
                volume: 0.7,
                audio: allAudio
            });

            // 更新载入更多按钮状态
            if (data.length < 10) {
                $('.aplayer-more').text('没有了');
            } else {
                $('.aplayer-more').text('载入更多（无法播放请换一个试试）');
            }

            // 重新绑定载入更多事件
            addLoadMoreButton();
        } else {
            $('.aplayer-more').text('没有了');
        }
    } catch (error) {
        console.error('载入更多失败:', error);
        $('.aplayer-more').text('加载失败，点击重试');
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
