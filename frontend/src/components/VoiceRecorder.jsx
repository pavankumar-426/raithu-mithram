import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Sparkles, Loader2, Play, RefreshCw, Send, CheckCircle2 } from 'lucide-react';

export default function VoiceRecorder({ onResultReceived, activeResult, isProcessing, setIsProcessing }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [speechError, setSpeechError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const recognitionRef = useRef(null);
  const audioElementRef = useRef(new Audio());

  // Quick preset voice prompts for farmers / hackathon judges
  const presetQueries = [
    {
      label: "వరి ఎరువుల మోతాదు & దరఖాస్తు",
      tag: "Form + Dosage",
      query: "నా పేరు కార్తీక్ తల్లూరి. నా వద్ద 4 ఎకరాల భూమి ఉంది. వరి పంటకు ఎంత యూరియా వేయాలి? మరియు PM-KISAN దరఖాస్తు చేయాలి."
    },
    {
      label: "రైతు భరోసా పథకం అర్హతలు",
      tag: "Gov Scheme",
      query: "రైతు భరోసా పథకం అర్హతలు ఏమిటి? నాకు ఎకరానికి ఎంత సాయం అందుతుంది?"
    },
    {
      label: "గుంటూరు మిర్చి ధర & స్ప్రే",
      tag: "Mandi + Weather",
      query: "గుంటూరు మార్కెట్లో మిర్చి ధర ఎంత ఉంది? ఈరోజు ఎకరానికి మందు పిచికారీ చేయవచ్చా?"
    },
    {
      label: "పత్తి పంట ఎరువుల మోతాదు",
      tag: "Crop Dosage",
      query: "నాకు 3 ఎకరాల పత్తి చేను ఉంది. ఎకరాకు ఎన్ని బస్తాల యూరియా, డీఏపీ అవసరం?"
    }
  ];

  // Initialize Speech Recognition if supported
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'te-IN'; // Spoken Telugu

      recognition.onresult = (event) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          interim += event.results[i][0].transcript;
        }
        if (interim) {
          setLiveTranscript(interim);
        }
      };

      recognition.onerror = (e) => {
        console.warn("Speech recognition error:", e.error);
        if (e.error !== 'no-speech') {
          setSpeechError(e.error);
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Handle Playback of Returned Audio
  const playResponseAudio = (audioBase64, teluguText) => {
    // If Sarvam / API returned base64 audio
    if (audioBase64) {
      try {
        const audioSrc = `data:audio/wav;base64,${audioBase64}`;
        audioElementRef.current.src = audioSrc;
        audioElementRef.current.play()
          .then(() => setIsPlayingAudio(true))
          .catch((e) => {
            console.warn("Audio element play error, falling back to speech synthesis:", e);
            speakBrowserFallback(teluguText);
          });

        audioElementRef.current.onended = () => {
          setIsPlayingAudio(false);
          // If the audio was just the short chime fallback, speak the Telugu text naturally
          if (teluguText && (!audioBase64 || audioBase64.length < 50000)) {
            speakBrowserFallback(teluguText);
          }
        };
        return;
      } catch (err) {
        console.error("Audio playback error:", err);
      }
    }

    // Direct browser Telugu speech synthesis
    speakBrowserFallback(teluguText);
  };

  const speakBrowserFallback = (text) => {
    if (!window.speechSynthesis || !text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'te-IN';
    utterance.rate = 0.9; // Rural-friendly clear tempo
    utterance.pitch = 1.0;

    // Pick Telugu voice if available
    const voices = window.speechSynthesis.getVoices();
    const teVoice = voices.find(v => v.lang.startsWith('te') || v.name.includes('Telugu'));
    if (teVoice) {
      utterance.voice = teVoice;
    }

    utterance.onstart = () => setIsPlayingAudio(true);
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopPlayback = () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.currentTime = 0;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
  };

  // Start Recording
  const startRecording = async () => {
    try {
      setSpeechError(null);
      setLiveTranscript('');
      setRecordingDuration(0);
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Audio Visualizer setup
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        audioContextRef.current = audioCtx;
        analyserRef.current = analyser;

        const updateLevel = () => {
          if (!analyserRef.current) return;
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          const avg = dataArray.reduce((p, c) => p + c, 0) / dataArray.length;
          setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
          animFrameRef.current = requestAnimationFrame(updateLevel);
        };
        updateLevel();
      } catch (visErr) {
        console.warn("Visualizer init notice:", visErr);
      }

      // MediaRecorder setup
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        // Stop stream tracks
        stream.getTracks().forEach(track => track.stop());
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close().catch(() => {});
        }
        await sendAudioToBackend(audioBlob);
      };

      mediaRecorder.start(250);
      setIsRecording(true);

      // Start recognition if available
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.warn("Recognition start skip:", e);
        }
      }

      // Timer
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Mic access error:", err);
      setSpeechError("మైక్రోఫోన్ అనుమతి లభించలేదు. దయచేసి బ్రౌజర్ అనుమతి ఇవ్వండి లేదా క్రింద టైప్ చేయండి.");
      setIsRecording(false);
    }
  };

  // Stop Recording
  const stopRecording = () => {
    if (!isRecording) return;
    setIsRecording(false);
    clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setAudioLevel(0);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  // Send audio file or transcript to backend
  const sendAudioToBackend = async (audioBlob) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      if (audioBlob && audioBlob.size > 100) {
        formData.append("file", audioBlob, "farmer_voice.wav");
      }
      if (liveTranscript) {
        formData.append("transcript_text", liveTranscript);
      }

      const res = await fetch("/api/process-voice", {
        method: "POST",
        body: formData
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      onResultReceived(data);

      // Auto play the spoken Telugu response
      const teResponse = data?.ai_result?.user_response_te;
      playResponseAudio(data?.audio_base64, teResponse);

    } catch (err) {
      console.error("Voice processing error:", err);
      setSpeechError("సర్వర్ తో కనెక్ట్ కాలేకపోయాము. దయచేసి మళ్లీ ప్రయత్నించండి.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Quick Query Submit
  const handlePresetSelect = async (queryText) => {
    setTextInput(queryText);
    setLiveTranscript(queryText);
    setIsProcessing(true);
    setSpeechError(null);

    try {
      const res = await fetch("/api/process-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: queryText })
      });

      if (!res.ok) throw new Error("Processing failed");
      const data = await res.json();
      onResultReceived(data);

      const teResponse = data?.ai_result?.user_response_te;
      playResponseAudio(data?.audio_base64, teResponse);
    } catch (e) {
      console.error("Preset query error:", e);
      setSpeechError("ప్రశ్నను ప్రాసెస్ చేయడంలో లోపం ఏర్పడింది.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-emerald-100 p-6 md:p-8 flex flex-col items-center relative overflow-hidden">
      {/* Background radial accent */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-100/60 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-amber-100/60 rounded-full blur-3xl pointer-events-none" />

      {/* Header Info */}
      <div className="text-center mb-6 z-10 max-w-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>తెలుగు వాయిస్ అసిస్టెంట్ • Telugu Spoken Agri-AI</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
          ఏదైనా అడగండి, మీ భాషలోనే!
        </h2>
        <p className="text-sm md:text-base text-slate-600 mt-1">
          ఎరువుల మోతాదు, మార్కెట్ ధరలు, ప్రభుత్వ పథకాల దరఖాస్తు గురించి నేరుగా మాట్లాడండి.
        </p>
      </div>

      {/* Main Big Mic Button with Pulsing Rings */}
      <div className="relative my-4 flex items-center justify-center">
        {/* Pulsing visual circles when recording */}
        {isRecording && (
          <>
            <div 
              className="absolute rounded-full bg-emerald-400/20 animate-ping"
              style={{ width: `${140 + audioLevel * 1.2}px`, height: `${140 + audioLevel * 1.2}px` }}
            />
            <div 
              className="absolute rounded-full bg-emerald-500/30 transition-all duration-100 ease-out"
              style={{ width: `${120 + audioLevel * 0.8}px`, height: `${120 + audioLevel * 0.8}px` }}
            />
          </>
        )}

        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
          aria-label={isRecording ? "Stop Recording" : "Start Recording"}
          className={`relative z-20 w-28 h-28 md:w-32 md:h-32 rounded-full flex flex-col items-center justify-center transition-all duration-300 transform shadow-2xl focus:outline-none focus:ring-4 focus:ring-emerald-300 ${
            isRecording
              ? 'bg-gradient-to-tr from-rose-600 to-red-500 scale-105 text-white ring-8 ring-rose-200'
              : isProcessing
              ? 'bg-slate-200 text-slate-400 cursor-wait'
              : 'bg-gradient-to-tr from-emerald-600 to-green-500 hover:from-emerald-700 hover:to-green-600 text-white hover:scale-105 shadow-emerald-500/30'
          }`}
        >
          {isProcessing ? (
            <Loader2 className="w-12 h-12 animate-spin text-emerald-700" />
          ) : isRecording ? (
            <>
              <MicOff className="w-12 h-12 animate-pulse text-white mb-1" />
              <span className="text-xs font-bold uppercase tracking-wider">{recordingDuration}s</span>
            </>
          ) : (
            <>
              <Mic className="w-12 h-12 text-white mb-1 drop-shadow" />
              <span className="text-xs font-bold tracking-wide">నొక్కండి</span>
            </>
          )}
        </button>
      </div>

      {/* Status Instruction Bar */}
      <div className="mt-4 text-center z-10">
        <p className={`text-base font-bold transition-colors ${
          isRecording ? 'text-rose-600 animate-pulse' : isProcessing ? 'text-amber-600' : 'text-emerald-800'
        }`}>
          {isRecording
            ? "వింటున్నాము... మీ సందేహం స్పష్టంగా మాట్లాడండి"
            : isProcessing
            ? "పరిశీలిస్తున్నాము... కొద్ది క్షణాలు ఆగండి"
            : "మైక్ నొక్కి తెలుగులో మాట్లాడండి (Tap Mic to Speak)"}
        </p>

        {/* Live Audio Visualizer Bars */}
        {isRecording && (
          <div className="flex items-center justify-center gap-1.5 mt-3 h-8">
            {[40, 75, 90, 60, 100, 70, 85, 50, 65].map((h, i) => (
              <span
                key={i}
                className="w-1.5 bg-emerald-500 rounded-full transition-all duration-75"
                style={{
                  height: `${Math.max(6, (h * (audioLevel || 25)) / 100)}px`,
                  opacity: 0.7 + (i % 2) * 0.3
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Live Transcript / Speech error display */}
      {(liveTranscript || activeResult?.transcript) && (
        <div className="mt-4 w-full max-w-xl bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-800 text-sm shadow-inner transition-all">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span>మీరు మాట్లాడిన మాటలు (Your Voice Query):</span>
            {isRecording && <span className="text-rose-600 flex items-center gap-1">● లైవ్ రికార్డింగ్</span>}
          </div>
          <p className="font-medium text-slate-900 leading-relaxed">
            "{liveTranscript || activeResult?.transcript}"
          </p>
        </div>
      )}

      {speechError && (
        <div className="mt-3 text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-2">
          {speechError}
        </div>
      )}

      {/* Audio Playback Controls for the Response */}
      {activeResult?.ai_result?.user_response_te && (
        <div className="mt-5 w-full max-w-xl bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-900 uppercase tracking-wider">రైతు నేస్తం సమాధానం (Audio Answer)</p>
              <p className="text-xs text-emerald-700">సహజమైన తెలుగు వాయిస్ ద్వారా వినండి</p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => playResponseAudio(activeResult.audio_base64, activeResult.ai_result.user_response_te)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow transition"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>మళ్లీ వినండి (Replay)</span>
            </button>
            {isPlayingAudio && (
              <button
                onClick={stopPlayback}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 text-xs font-bold rounded-lg transition"
              >
                <VolumeX className="w-3.5 h-3.5" />
                <span>ఆపండి</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* One-Tap Voice Test Prompts */}
      <div className="mt-6 w-full max-w-xl">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>రైతు ప్రశ్నల నమూనాలు (Quick Voice Samples - Click to Try):</span>
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {presetQueries.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handlePresetSelect(item.query)}
              disabled={isProcessing}
              className="text-left p-2.5 rounded-xl border border-slate-200 hover:border-emerald-500 bg-white hover:bg-emerald-50/50 transition duration-150 flex flex-col group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 group-hover:text-emerald-700">
                  {item.label}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                  {item.tag}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                "{item.query}"
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Optional Manual Text Intake for Quiet Environments */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (textInput.trim()) handlePresetSelect(textInput);
        }}
        className="mt-5 w-full max-w-xl flex items-center gap-2"
      >
        <input
          type="text"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder="లేదా ఇక్కడ ప్రశ్న రాయండి (Or type your query)..."
          className="flex-1 px-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
        />
        <button
          type="submit"
          disabled={!textInput.trim() || isProcessing}
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white text-sm font-semibold rounded-xl flex items-center gap-1.5 transition"
        >
          <Send className="w-4 h-4" />
          <span>పంపు</span>
        </button>
      </form>
    </div>
  );
}

