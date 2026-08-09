// 平台配置
const platforms = {
    netease: {
        name: '网易云音乐',
        hint: '网易云音乐歌曲ID，从歌曲页面URL获取',
        // 外链接口
        getUrl: (id) => `http://music.163.com/song/media/outer/url?id=${id}.mp3`,
        // 解析ID（支持完整链接）
        parseId: (input) => {
            const match = input.match(/id=(\d+)/);
            return match ? match[1] : input.trim();
        }
    },
    qq: {
        name: 'QQ音乐',
        hint: 'QQ音乐歌曲mid，从歌曲页面URL获取',
        getUrl: (id) => `http://dl.stream.qqmusic.qq.com/C400${id}.m4a?guid=365586308&vkey=&tag=from_newtplayer`,
        parseId: (input) => {
            const match = input.match(/\/([A-Za-z0-9]+)\.html/) || input.match(/song\/([A-Za-z0-9]+)/);
            return match ? match[1] : input.trim();
        }
    },
    kugou: {
        name: '酷狗音乐',
        hint: '酷狗音乐歌曲hash，从歌曲页面URL获取',
        getUrl: (id) => `http://trackercdn.kugou.com/i/v2/?cmd=25&pid=1&behavior=play&hash=${id}`,
        parseId: (input) => {
            const match = input.match(/hash=([a-f0-9]+)/i);
            return match ? match[1] : input.trim();
        }
    },
    kuwo: {
        name: '酷我音乐',
        hint: '酷我音乐歌曲ID，从歌曲页面URL获取',
        getUrl: (id) => `http://antiserver.kuwo.cn/anti.s?rid=MUSIC_${id}&response=res&format=mp3|aac&type=convert_url&br=320kmp3&agent=iPhone`,
        parseId: (input) => {
            const match = input.match(/id=(\d+)/) || input.match(/\/(\d+)/);
            return match ? match[1] : input.trim();
        }
    }
};

// 切换平台时更新提示
document.getElementById('platform').addEventListener('change', function() {
    const platform = platforms[this.value];
    document.getElementById('hint').textContent = platform.hint;
});

// 解析音乐
function parseMusic() {
    const platformKey = document.getElementById('platform').value;
    const input = document.getElementById('songId').value.trim();
    
    if (!input) {
        alert('请输入歌曲ID或链接');
        return;
    }

    const platform = platforms[platformKey];
    const songId = platform.parseId(input);
    
    if (!songId) {
        alert('无法识别歌曲ID，请检查输入');
        return;
    }

    const url = platform.getUrl(songId);
    
    // 显示结果
    document.getElementById('result').classList.remove('hidden');
    document.getElementById('songTitle').textContent = platform.name + ' 歌曲';
    document.getElementById('songArtist').textContent = 'ID: ' + songId;
    document.getElementById('songAlbum').textContent = '';
    document.getElementById('cover').src = '';
    
    // 设置音频
    const audio = document.getElementById('audioPlayer');
    audio.src = url;
    
    // 设置下载链接
    document.getElementById('downloadBtn').href = url;
    
    // 设置分享链接
    document.getElementById('shareLink').value = url;
}

// 复制链接
function copyLink() {
    const linkInput = document.getElementById('shareLink');
    linkInput.select();
    document.execCommand('copy');
    
    const btn = document.querySelector('.btn-copy');
    const originalText = btn.textContent;
    btn.textContent = '已复制!';
    setTimeout(() => {
        btn.textContent = originalText;
    }, 2000);
}

// 支持回车键解析
document.getElementById('songId').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        parseMusic();
    }
});
