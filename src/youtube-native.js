/*global YT*/

import videojs from 'video.js';

// UTIL: Since we don't want to touch the iframe, and use Youtube "native" UI,
// let's add a new styling rule to have the same style as `vjs-tech`
let cssInjected = false;
function injectCss() {
	if (cssInjected) {
		return;
	}
	cssInjected = true;
	const css = `
	.vjs-youtube iframe {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}
	`;
	const head = document.head || document.getElementsByTagName('head')[0];
	
	const style = document.createElement('style');
	
	style.type = 'text/css';
	
	if (style.styleSheet) {
		style.styleSheet.cssText = css;
	} else {
		style.appendChild(document.createTextNode(css));
	}
	
	head.appendChild(style);
}

// UTIL: To load a script
function loadScript(src, callback) {
	var loaded = false;
	var tag = document.createElement('script');
	var firstScriptTag = document.getElementsByTagName('script')[0];
	if (!firstScriptTag) {
	// when loaded in jest without jsdom setup it doesn't get any element.
	// In jest it doesn't really make sense to do anything, because no one is watching youtube in jest
		return;
	}
	firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
	tag.onload = function () {
		if (!loaded) {
			loaded = true;
			callback();
		}
	};
	tag.onreadystatechange = function () {
		if (!loaded && (this.readyState === 'complete' || this.readyState === 'loaded')) {
			loaded = true;
			callback();
		}
	};
	tag.src = src;
}

// UTIL: Load YouTube API
const YoutubeAPI = {
	isReady: false,
	apiReadyQueue: []
}
function loadYouTubeAPI() {
	if (typeof document !== 'undefined'){
		loadScript('https://www.youtube.com/iframe_api', () => {
	
			// YT is the YouTube API global object, added by the iframe_api script
			YT.ready(function() {
				YoutubeAPI.isReady = true;
			
				for (var i = 0; i < YoutubeAPI.apiReadyQueue.length; ++i) {
					YoutubeAPI.apiReadyQueue[i].initYouTubePlayer();
				}
			});
		});
	}
}

// const Component = videojs.getComponent('Component');
const Tech = videojs.getComponent('Tech');
const _isOnMobile = videojs.browser.IS_IOS || videojs.browser.IS_NATIVE_ANDROID;


/**
 * Youtube - Wrapper for Video Player API
 *
 * @param {Object=} options Object of option names and values
 * @param {Function=} ready Ready callback function
 * @extends Tech
 * @class Youtube
 */
class Youtube extends Tech {
	constructor(options, ready) {
		super(options, ready);

		injectCss();
		//this.setPoster(options.poster);
		this.setSrc(this.options_.source);

		// Parent is not set yet so we have to wait a tick - why?
		this.setTimeout(() => {
			if (YoutubeAPI.isReady) {
				this.initYouTubePlayer();
			} else {
				YoutubeAPI.apiReadyQueue.push(this);
			}
		});

	}

	initYouTubePlayer() {

		// PORT: TODO: Find a way of doing this correctly
		document.querySelector('#' + this.options_.playerId).classList.add('vjs-using-native-controls');

		var playerVars = {
			controls: 1,
			modestbranding: 1,
			rel: 0,
			showinfo: 0,
			loop: this.options_.loop ? 1 : 0
		};
	
		// Let the user set any YouTube parameter
		// https://developers.google.com/youtube/player_parameters?playerVersion=HTML5#Parameters
		// To use the loop or autoplay, use the video.js settings
	
		if (typeof this.options_.autohide !== 'undefined') {
			playerVars.autohide = this.options_.autohide;
		}
	
		if (typeof this.options_['cc_load_policy'] !== 'undefined') {
			playerVars['cc_load_policy'] = this.options_['cc_load_policy'];
		}
	
		if (typeof this.options_.disablekb !== 'undefined') {
			playerVars.disablekb = this.options_.disablekb;
		}
	
		if (typeof this.options_.color !== 'undefined') {
			playerVars.color = this.options_.color;
		}
	
		if (this.options_.source.src.indexOf('end=') !== -1) {
			var srcEndTime = this.options_.source.src.match(/end=([0-9]*)/);
			this.options_.end = parseInt(srcEndTime[1]);
		}
	
		if (typeof this.options_.end !== 'undefined') {
			playerVars.end = this.options_.end;
		}
	
		// PORT: Not sure if needed
		/* if (typeof this.options_.hl !== 'undefined') {
			playerVars.hl = this.options_.hl;
		} else if (typeof this.options_.language !== 'undefined') {
			// Set the YouTube player on the same language than video.js
			playerVars.hl = this.options_.language.substr(0, 2);
		} */
	
		if (typeof this.options_['iv_load_policy'] !== 'undefined') {
			playerVars['iv_load_policy'] = this.options_['iv_load_policy'];
		}
	
		if (typeof this.options_.list !== 'undefined') {
			playerVars.list = this.options_.list;
		} else if (this.url && typeof this.url.listId !== 'undefined') {
			playerVars.list = this.url.listId;
		}
	
		if (typeof this.options_.listType !== 'undefined') {
			playerVars.listType = this.options_.listType;
		}
	
		if (typeof this.options_.modestbranding !== 'undefined') {
			playerVars.modestbranding = this.options_.modestbranding;
		}
	
		if (typeof this.options_.playlist !== 'undefined') {
			playerVars.playlist = this.options_.playlist;
		}
	
		if (typeof this.options_.playsinline !== 'undefined') {
			playerVars.playsinline = this.options_.playsinline;
		}
	
		if (typeof this.options_.rel !== 'undefined') {
			playerVars.rel = this.options_.rel;
		}
	
		if (typeof this.options_.showinfo !== 'undefined') {
			playerVars.showinfo = this.options_.showinfo;
		}
	
		if (this.options_.source.src.indexOf('start=') !== -1) {
			var srcStartTime = this.options_.source.src.match(/start=([0-9]*)/);
			this.options_.start = parseInt(srcStartTime[1]);
		}
	
		if (typeof this.options_.start !== 'undefined') {
			playerVars.start = this.options_.start;
		}
	
		if (typeof this.options_.theme !== 'undefined') {
			playerVars.theme = this.options_.theme;
		}
	
		// Allow undocumented options to be passed along via customVars
		if (typeof this.options_.customVars !== 'undefined') {
			var customVars = this.options_.customVars;
			Object.keys(customVars).forEach(function(key) {
				playerVars[key] = customVars[key];
			});
		}
	
		this.activeVideoId = this.url ? this.url.videoId : null;
		this.activeList = playerVars.list;
	
		var playerConfig = {
			videoId: this.activeVideoId,
			playerVars: playerVars,
			events: {
				onReady: this.onPlayerReady.bind(this),
				onPlaybackQualityChange: this.onPlayerPlaybackQualityChange.bind(this),
				onPlaybackRateChange: this.onPlayerPlaybackRateChange.bind(this),
				onStateChange: this.onPlayerStateChange.bind(this),
				onVolumeChange: this.onPlayerVolumeChange.bind(this),
				onError: this.onPlayerError.bind(this)
			}
		};
	
		if (typeof this.options_.enablePrivacyEnhancedMode !== 'undefined' && this.options_.enablePrivacyEnhancedMode) {
			playerConfig.host = 'https://www.youtube-nocookie.com';
		}

		this.ytPlayer = new YT.Player(this.options_.techId, playerConfig);
	}

	onPlayerReady() {
		if (this.options_.muted) {
			this.ytPlayer.mute();
		}
	
		var playbackRates = this.ytPlayer.getAvailablePlaybackRates();
		if (playbackRates.length > 1) {
			this.featuresPlaybackRate = true;
		}
	
		this.playerReady_ = true;
		this.triggerReady();
	
		if (this.playOnReady) {
			this.play();
		}
		
	}

	onPlayerPlaybackQualityChange() {
	
	}

	onPlayerPlaybackRateChange() {
		this.trigger('ratechange');
	}

	onPlayerStateChange(e) {
		var state = e.data;
	
		if (state === this.lastState || this.errorNumber) {
			return;
		}
	
		this.lastState = state;
	
		switch (state) {
			case -1:
				//this.trigger('loadstart');
				//this.trigger('loadedmetadata');
				this.trigger('durationchange');
				this.trigger('ratechange');

				break;
		
			case YT.PlayerState.ENDED:
				this.trigger('ended');
				break;
		
			case YT.PlayerState.PLAYING:
				this.trigger('timeupdate');
				this.trigger('durationchange');
				this.trigger('playing');
				this.trigger('play');
		
				if (this.isSeeking) {
					this.onSeeked();
				}
				break;

			case YT.PlayerState.PAUSED:
				this.trigger('canplay');
				if (this.isSeeking) {
					this.onSeeked();
				} else {
					this.trigger('pause');
				}
				break;
	
			case YT.PlayerState.BUFFERING:
				this.player_.trigger('timeupdate');
				//this.player_.trigger('waiting');
				break;
		}
	}

	onPlayerVolumeChange() {
		this.trigger('volumechange');
	}

	onPlayerError(e) {
		this.errorNumber = e.data;
		this.trigger('pause');
		this.trigger('error');
	}

	error() {
		var code = 1000 + this.errorNumber; // as smaller codes are reserved
		switch (this.errorNumber) {
			case 5:
				return { code: code, message: 'Error while trying to play the video' };
	
			case 2:
			case 100:
				return { code: code, message: 'Unable to find the video' };
	
			case 101:
			case 150:
				return {
					code: code,
					message: 'Playback on other Websites has been disabled by the video owner.'
				};
		}

		return { code: code, message: 'YouTube unknown error (' + this.errorNumber + ')' };
	}

	createEl() {
		const div = videojs.dom.createEl('div', {
			id: this.options_.techId
		});

		div.style.cssText = 'width:100%;height:100%;top:0;left:0;position:absolute';
		div.className = 'vjs-youtube';

		return div;
	}

	controls() {
		return false;
	}
	
	// TODO: This is not doing anything currently, but it should. investigate.
	usingNativeControls() {
		return true;
	}

	supportsFullScreen() {
		return true;
	}

	src(src) {
		if (src) {
			this.setSrc({ src: src });
		}
	
		return this.source;
	}

	setSrc(source) {
		if (!source || !source.src) {
			return;
		}
	
		delete this.errorNumber;
		this.source = source;
		this.url = this.parseYouTubeUrl(source.src);
	
		if (this.options_.autoplay && !_isOnMobile) {
			if (this.isReady_) {
				this.play();
			} else {
				this.playOnReady = true;
			}
		} 

	}

	currentSrc() {
		//TODO: cleanup, the || part might not be needed
		return (this.source && this.source.src) || this.options_.source.src;
	}

	parseYouTubeUrl(url) {
		var result = {
			videoId: null
		};
	
		// eslint-disable-next-line no-useless-escape
		var regex = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
		var match = url.match(regex);
	
		if (match && match[2].length === 11) {
			result.videoId = match[2];
		}
	
		// eslint-disable-next-line no-useless-escape
		var regPlaylist = /[?&]list=([^#\&\?]+)/;
		match = url.match(regPlaylist);
	
		if(match && match[1]) {
			result.listId = match[1];
		}
	
		return result;
	}

	play() {
		if (!this.url || !this.url.videoId) {
			return;
		}

		if (this.isReady_) {
	
			if (this.activeVideoId === this.url.videoId) {
				this.ytPlayer.playVideo();
				//document.querySelector('.vjs-poster').style.display = 'none';
			}
			
		} else {
			//this.trigger('waiting');
			this.playOnReady = true;
		}
	}

	autoplay() {
		return this.options_.autoplay;
	}

	//TODO: cleanup, might not be needed
	setAutoplay(val) {
		this.options_.autoplay = val;
	}

	//TODO: cleanup, might not be needed
	loop() {
		return this.options_.loop;
	}

	//TODO: cleanup, might not be needed
	setLoop(val) {
		this.options_.loop = val;
	}

	pause() {
		if (this.ytPlayer) {
			this.ytPlayer.pauseVideo();
		}
	}

	paused() {
		return (this.ytPlayer) ?
			(this.lastState !== YT.PlayerState.PLAYING && this.lastState !== YT.PlayerState.BUFFERING)
			: true;
	}

	currentTime() {
		return this.ytPlayer ? this.ytPlayer.getCurrentTime() : 0;
	}

	setCurrentTime(seconds) {
		if (this.lastState === YT.PlayerState.PAUSED) {
			this.timeBeforeSeek = this.currentTime();
		}

		/* if (!this.isSeeking) {
			this.wasPausedBeforeSeek = this.paused();
		} */
	
		this.ytPlayer.seekTo(seconds, true);
		this.trigger('timeupdate');
		//this.trigger('seeking');
		this.isSeeking = true;
	
		// A seek event during pause does not return an event to trigger a seeked event,
		// so run an interval timer to look for the currentTime to change
		if (this.lastState === YT.PlayerState.PAUSED && this.timeBeforeSeek !== seconds) {
			clearInterval(this.checkSeekedInPauseInterval);
			this.checkSeekedInPauseInterval = setInterval(function() {
				if (this.lastState !== YT.PlayerState.PAUSED || !this.isSeeking) {
					// If something changed while we were waiting for the currentTime to change,
					//  clear the interval timer
					clearInterval(this.checkSeekedInPauseInterval);
				} else if (this.currentTime() !== this.timeBeforeSeek) {
					this.trigger('timeupdate');
					this.onSeeked();
				}
			}.bind(this), 250);
		}
	}

	/* seeking () {
		return this.isSeeking;
	}

	seekable () {
		if(!this.ytPlayer) {
			return videojs.createTimeRange();
		}
	
		return videojs.createTimeRange(0, this.ytPlayer.getDuration());
	} */

	onSeeked() {
		clearInterval(this.checkSeekedInPauseInterval);
		this.isSeeking = false;
	
		/* if (this.wasPausedBeforeSeek) {
			this.pause();
		} */
	
		this.trigger('seeked');
	}

	playbackRate() {
		return this.ytPlayer ? this.ytPlayer.getPlaybackRate() : 1;
	}

	setPlaybackRate(suggestedRate) {
		if (!this.ytPlayer) {
			return;
		}

		this.ytPlayer.setPlaybackRate(suggestedRate);
	}

	duration() {
		return this.ytPlayer ? this.ytPlayer.getDuration() : 0;
	}


	ended() {
		return this.ytPlayer ? (this.lastState === YT.PlayerState.ENDED) : false;
	}

	volume() {
		return this.ytPlayer ? this.ytPlayer.getVolume() / 100.0 : 1;
	}

	setVolume(percentAsDecimal) {
		if (!this.ytPlayer) {
			return;
		}
	
		this.ytPlayer.setVolume(percentAsDecimal * 100.0);
	}

	muted() {
		return this.ytPlayer ? this.ytPlayer.isMuted() : false;
	}

	// Youtube does has a mute API and videojs controls aren't being used,
	// so setMuted doesn't really make sense and shouldn't be called.
	// setMuted(mute) {}

	buffered() {
		if(!this.ytPlayer || !this.ytPlayer.getVideoLoadedFraction) {
			return videojs.createTimeRange();
		}
	
		var bufferedEnd = this.ytPlayer.getVideoLoadedFraction() * this.ytPlayer.getDuration();
	
		return videojs.createTimeRange(0, bufferedEnd);
	}

	dispose() {
		if (this.ytPlayer) {
			//Dispose of the YouTube Player
			if (this.ytPlayer.stopVideo) {
				this.ytPlayer.stopVideo();
			}
			if (this.ytPlayer.destroy) {
				this.ytPlayer.destroy();
			}
		} else {
			//YouTube API hasn't finished loading or the player is already disposed
			var index = YoutubeAPI.apiReadyQueue.indexOf(this);
			if (index !== -1) {
				YoutubeAPI.apiReadyQueue.splice(index, 1);
			}
		}
		this.ytPlayer = null;
	
		/* this.el_.parentNode.className = this.el_.parentNode.className
			.replace(' vjs-youtube', '')
			.replace(' vjs-youtube-mobile', ''); */
		this.el_.parentNode.removeChild(this.el_);
	
		//Needs to be called after the YouTube player is destroyed, otherwise there will be a null reference exception
		Tech.prototype.dispose.call(this);
	}

}

Youtube.prototype.featuresTimeupdateEvents = true;

Youtube.isSupported = function() {
	return true;
};

// Add Source Handler pattern functions to this tech
Tech.withSourceHandlers(Youtube);

Youtube.nativeSourceHandler = {};

/**
 * Check if Youtube can play the given videotype
 * @param  {String} type    The mimetype to check
 * @return {String}         'maybe', or '' (empty string)
 */
Youtube.nativeSourceHandler.canPlayType = function(type) {
	if (type === 'video/youtube') {
		return 'maybe';
	}

	return '';
};

/* Youtube.canPlaySource = function(source) {
	return Youtube.canPlayType(source.type);
}; */

/*
 * Check Youtube can handle the source natively
 *
 * @param  {Object} source  The source object
 * @return {String}         'maybe', or '' (empty string)
 * @note: Copied over from YouTube — not sure this is relevant
 */
Youtube.nativeSourceHandler.canHandleSource = function(source) {
	if (source.type) {
		return Youtube.nativeSourceHandler.canPlayType(source.type);
	} else if (source.src) {
		return Youtube.nativeSourceHandler.canPlayType(source.src);
	}

	return '';
};

// @note: Copied over from Videojs HTML tech — not sure this is relevant
Youtube.nativeSourceHandler.handleSource = function(source, tech) {
	tech.src(source.src);
};

// @note: Copied over from Videojs HTML tech — not sure this is relevant
//Youtube.nativeSourceHandler.dispose = function() { };

Youtube.registerSourceHandler(Youtube.nativeSourceHandler);

// ****************** fix for version 6 and 7 update*************
// Component.registerComponent('Vimeo', Vimeo);
// Tech.registerTech('Vimeo', Vimeo);

if (typeof videojs.registerTech !== 'undefined') {
	videojs.registerTech('Youtube', Youtube);
} else {
	videojs.registerComponent('Youtube', Youtube);
}
// Include the version number.
Youtube.VERSION = '0.0.1';

// Initialize YouTube API
loadYouTubeAPI();

export default Youtube;