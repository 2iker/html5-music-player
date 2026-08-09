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

    // 显示加载状态
    $('.music-submit').text('搜索中...').prop('disabled', true);

    try {
        // 使用cloudsearch接口（新版）
        var url = API_BASE + '/cloudsearch?keywords=' + encodeURIComponent(keyword) + '&limit=10&type=1';
        console.log('请求URL:', url);

        var response = await fetch(url);
        console.log('响应状态:', response.status);

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
            // 显示搜索结果列表
            displayResults(songs);
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

// 显示搜索结果列表
function displayResults(songs) {
    var resultList = $('#resultList');
    resultList.empty();

    songs.forEach(function(song, index) {
        var artists = song.ar ? song.ar.map(function(a) { return a.name; }).join('/') : '未知';
        var album = song.al ? song.al.name : '';
        var html = '<div class="result-item" data-songid="' + song.id + '">' +
            '<span class="index">' + (index + 1) + '</span>' +
            '<div class="song-info">' +
            '<h4>' + escapeHtml(song.name) + ' <span class="id">ID: ' + song.id + '</span></h4>' +
            '<p>' + escapeHtml(artists) + (album ? ' - ' + escapeHtml(album) : '') + '</p>' +
            '</div>' +
            '<div class="actions">' +
            '<button class="btn-play am-btn am-btn-primary am-btn-sm" onclick="playSongById(' + song.id + ')">播放</button>' +
            '<button class="btn-copy am-btn am-btn-default am-btn-sm" onclick="copyUrl(\'http://music.163.com/song/media/outer/url?id=' + song.id + '.mp3\')">复制</button>' +
            '</div>' +
            '</div>';
        resultList.append(html);
    });

    // 切换到结果页面
    $('#searchForm').hide();
    $('#resultForm').show();
    $('#searchTabsContainer').hide();
    $('#platformSelect').hide();
}

// 根据ID播放歌曲
async function playSongById(id) {
    try {
        // 获取歌曲详情
        var detailUrl = API_BASE + '/song/detail?ids=' + id;
        var detailResponse = await fetch(detailUrl);
        var detailData = await detailResponse.json();

        if (detailData.code === 200 && detailData.songs && detailData.songs.length > 0) {
            playSong(detailData.songs[0]);
        } else {
            alert('获取歌曲详情失败');
        }
    } catch (error) {
        console.error('获取歌曲详情失败:', error);
        alert('获取歌曲详情失败');
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
    var artists = song.ar ? song.ar.map(function(a) { return a.name; }).join('/') : '未知';
    var album = song.al ? song.al.name : '';
    var picUrl = song.al && song.al.picUrl ? song.al.picUrl : '';

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

    // 切换到播放界面
    $('#resultListContainer').hide();
    $('#playerContainer').show();
}

// 复制链接
function copyUrl(url) {
    navigator.clipboard.writeText(url).then(function() {
        alert('链接已复制！');
    }).catch(function() {
        var input = document.createElement('input');
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        alert('链接已复制！');
    });
}

// HTML转义
function escapeHtml(text) {
    if (!text) return '';
    var map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

// 支持回车键搜索
$('#searchInput').on('keypress', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        searchMusic();
    }
});
