// API配置
const API_BASE = 'https://api-enhanced-two-mu.vercel.app';

var player = null;
var playerList = [];

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

// 搜索音乐
async function searchMusic() {
    var keyword = $.trim($('#j-input').val());
    if (!keyword) {
        alert('请输入搜索内容');
        return;
    }

    var type = $('input[name="music_type"]:checked').val();
    $('#j-submit').text('搜索中...').prop('disabled', true);

    try {
        var url = API_BASE + '/cloudsearch?keywords=' + encodeURIComponent(keyword) + '&limit=10&type=1';
        console.log('请求URL:', url);

        var response = await fetch(url);
        var data = await response.json();
        console.log('返回数据:', data);

        // 解析歌曲列表
        var songs = null;
        if (data.body && data.body.result && data.body.result.songs) {
            songs = data.body.result.songs;
        } else if (data.result && data.result.songs) {
            songs = data.result.songs;
        }

        if (songs && songs.length > 0) {
            // 获取歌词
            var lyric = await getLyric(songs[0].id);

            // 转换为APlayer格式
            var musicList = [];
            for (var i = 0; i < songs.length; i++) {
                var song = songs[i];
                var artists = song.ar ? song.ar.map(function(a) { return a.name; }).join('/') : '未知';
                var album = song.al ? song.al.name : '';
                var picUrl = song.al && song.al.picUrl ? song.al.picUrl : '';
                var audioUrl = 'https://music.163.com/song/media/outer/url?id=' + song.id + '.mp3';

                musicList.push({
                    name: song.name,
                    artist: artists,
                    url: audioUrl,
                    cover: picUrl || 'https://p1.music.126.net/OdGMEPNgtU3B5F-Gc6yN_A==/109951167657874880.jpg',
                    lrc: lyric
                });
            }

            // 显示播放器
            $('#j-validator').hide();
            $('#j-main').show();

            // 更新歌曲信息
            var firstSong = songs[0];
            var firstArtists = firstSong.ar ? firstSong.ar.map(function(a) { return a.name; }).join('/') : '未知';
            $('#j-link').val('https://music.163.com/#/song?id=' + firstSong.id);
            $('#j-link-btn').attr('href', 'https://music.163.com/#/song?id=' + firstSong.id);
            $('#j-src').val(musicList[0].url);
            $('#j-src-btn').attr('href', musicList[0].url);
            $('#j-songid').val(firstSong.id);
            $('#j-name').val(firstSong.name);
            $('#j-author').val(firstArtists);
            $('#j-lrc').val(lyric.substring(0, 50) + '...');

            // 生成歌词下载链接
            window.currentLyric = lyric;
            window.currentSongName = firstSong.name;
            window.currentArtistName = firstArtists;
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
                audio: musicList
            });

            playerList = musicList;
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

// 支持回车键搜索
$('#j-input').on('keypress', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        searchMusic();
    }
});
