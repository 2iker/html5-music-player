// API配置
const API_BASE = 'https://api-enhanced-two-mu.vercel.app';

let ap = null;

// Tab切换
$('#searchTabs').on('click', 'li', function() {
    $(this).addClass('am-active').siblings('li').removeClass('am-active');
    var filter = $(this).data('filter');
    var placeholders = {
        name: '例如: 周杰伦 晴天',
        id: '例如: 25906124',
        url: '例如: https://music.163.com/#/song?id=25906124'
    };
    $('#searchInput').attr('placeholder', placeholders[filter]);
});

// 搜索表单提交
$('#searchForm').on('submit', function(e) {
    e.preventDefault();
    searchMusic();
});

// 返回按钮
$('#backBtn').on('click', function() {
    $('#searchForm').show();
    $('#resultForm').hide();
    if (ap) {
        ap.pause();
    }
});

// 搜索音乐
async function searchMusic() {
    var keyword = $.trim($('#searchInput').val());
    if (!keyword) {
        alert('请输入搜索内容');
        return;
    }

    var type = $('input[name="music_type"]:checked').val();

    // 显示加载状态
    $('.music-submit').text('搜索中...').prop('disabled', true);

    try {
        var url = API_BASE + '/search?keywords=' + encodeURIComponent(keyword) + '&limit=10';
        console.log('请求URL:', url);

        var response = await fetch(url);
        console.log('响应状态:', response.status);

        var data = await response.json();
        console.log('返回数据:', data);

        if (data.code === 200 && data.result && data.result.songs && data.result.songs.length > 0) {
            $('#searchForm').hide();
            $('#resultForm').show();
            playSong(data.result.songs[0]);
        } else {
            alert('未找到相关歌曲，请换个关键词试试');
        }
    } catch (error) {
        console.error('搜索失败:', error);
        alert('搜索失败: ' + error.message);
    } finally {
        $('.music-submit').text('⚡ 一键搜索').prop('disabled', false);
    }
}

// 获取歌曲播放链接
async function getSongUrl(id) {
    try {
        var url = API_BASE + '/song/url/v1?id=' + id + '&level=exhigh';
        var response = await fetch(url);
        var data = await response.json();

        if (data.code === 200 && data.data && data.data[0] && data.data[0].url) {
            return data.data[0].url;
        }
        // 备用方案
        return 'http://music.163.com/song/media/outer/url?id=' + id + '.mp3';
    } catch (error) {
        console.error('获取播放链接失败:', error);
        return 'http://music.163.com/song/media/outer/url?id=' + id + '.mp3';
    }
}

// 播放歌曲
async function playSong(song) {
    var artists = song.artists ? song.artists.map(function(a) { return a.name; }).join('/') : '未知';
    var album = song.album ? song.album.name : '';
    var picUrl = song.album && song.album.picUrl ? song.album.picUrl : '';

    // 获取播放链接
    var audioUrl = await getSongUrl(song.id);
    console.log('播放链接:', audioUrl);

    // 更新表单字段
    $('#linkInput').val('https://music.163.com/#/song?id=' + song.id);
    $('#linkBtn').attr('href', 'https://music.163.com/#/song?id=' + song.id);
    $('#srcInput').val(audioUrl);
    $('#srcBtn').attr('href', audioUrl);
    $('#idInput').val(song.id);
    $('#nameInput').val(song.name);
    $('#authorInput').val(artists);

    // 销毁旧播放器
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
}

// 支持回车键搜索
$('#searchInput').on('keypress', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        searchMusic();
    }
});
