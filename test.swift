// Model.swift

struct Sound {
    var name: String
    var sound: // 这里应该是一个 URL 或者 AuidoFile 类型
}

struct Cat: Identifiable {
    let id = UUID() // 自动生成唯一 ID
    var name: String
    var sounds: [Sound] // sounds 现在包含多个 Sound 对象
    var description: String
}


// ContentView.swift

// 主页面视图
struct HomeView: View {
    @State private var selectedCat: Cat?
    
    @State private var showAddCatSheet = false // 控制新增猫咪的 sheet 显示
     
    @State private var cats = [
        Cat(
            name: "罗小黑",
            sounds: [], // 这里默认是 Sound 类型
            description: "一个小黑猫，总是很调皮。"
        ),
        Cat(
            name: "其他猫咪",
            sounds: [] ,// 这里默认是 Sound 类型
            description: "另一只猫咪。"
        )
    ]
    
    var body: some View {
        VStack {
            // 其他视图


            // 底部浮动录音按钮
            RecordButton()
        }
        .padding()
        .onAppear {
            selectedCat = cats.first // 初始化时设置默认选中的猫咪
        }
    }
}

struct RecordButton: View {
    @State private var isRecording = false
    @State private var audioURL: IdentifiableURL?
    private var audioRecorder = AudioRecorder()
    
    var body: some View {
        HStack {
            Spacer()
            Button(action: {
                if isRecording {
                    // 停止录音并保存录音文件
                    audioRecorder.stopRecording()
                    audioURL = IdentifiableURL(url: audioRecorder.recordingURL)
                    isRecording = false
                } else {
                    // 开始录音
                    audioRecorder.startRecording()
                    isRecording = true
                }
            }) {
                // 切换录音按钮的图标
                Image(systemName: isRecording ? "stop.fill" : "mic.fill")
                    .font(.largeTitle)
                    .padding()
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .clipShape(Circle())
                    .shadow(radius: 10)
            }
            .padding()
        }
        // 展示录音文件的视图
        .sheet(item: $audioURL) { url in
            AudioView(audioURL: url)
        }
    }
}


// 音频录制的类
class AudioRecorder: NSObject, ObservableObject {
    private var audioRecorder: AVAudioRecorder!
    var recordingURL: URL {
        let paths = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)
        let documentsDirectory = paths[0]
        return documentsDirectory.appendingPathComponent("recording.m4a")
    }
    
    func startRecording() {
        let settings = [
            AVFormatIDKey: Int(kAudioFormatMPEG4AAC),
            AVSampleRateKey: 12000,
            AVNumberOfChannelsKey: 1,
            AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue
        ]
        
        do {
            audioRecorder = try AVAudioRecorder(url: recordingURL, settings: settings)
            audioRecorder.record()
        } catch {
            print("Could not start recording: \(error.localizedDescription)")
        }
    }
    
    func stopRecording() {
        audioRecorder.stop()
    }
}


// AudioView.swift
// 处理录音,进行编辑 添加名称等操作,并添加到 所属猫咪的 sounds 数组中
import SwiftUI
import AVFoundation

struct AudioView: View {
    var audioURL: IdentifiableURL?
    @State private var soundName = ""
    @State private var startTrim: Double = 0
    @State private var endTrim: Double = 1
    @State private var isClipping = false
    @State private var clippedAudioURL: IdentifiableURL?
    
    var body: some View {
        NavigationView {
            VStack {
                TextField(
                    "Sound Name",
                    text: $soundName
                )
                .textFieldStyle(
                    RoundedBorderTextFieldStyle()
                )
                .padding()
                
                // 音频剪辑滑动条
                HStack {
                    Text(
                        "Start"
                    )
                    Slider(
                        value: $startTrim,
                        in: 0...endTrim,
                        step: 0.01
                    )
                    Text(
                        "End"
                    )
                    Slider(
                        value: $endTrim,
                        in: startTrim...1,
                        step: 0.01
                    )
                }
                .padding()
                
                // 剪辑按钮
                Button(action: {
                    isClipping = true
                    let audioEditor = AudioEditor(
                        url: audioURL!.url
                    )
                    audioEditor.clipAudio(
                        start: startTrim,
                        end: endTrim
                    ) { url in
                        isClipping = false
                        clippedAudioURL = IdentifiableURL(
                            url: url!
                        )
                    }
                }) {
                    Text(
                        "Clip Audio"
                    )
                    .frame(
                        maxWidth: .infinity
                    )
                    .padding()
                    .background(
                        Color.blue
                    )
                    .foregroundColor(
                        .white
                    )
                    .cornerRadius(
                        10
                    )
                }
                .padding()
                .disabled(
                    isClipping
                )
                
                Spacer()
            }
            .navigationBarTitle(
                "Edit Audio",
                displayMode: .inline
            )
            .sheet(
                item: $clippedAudioURL
            ) { url in
                // 显示剪辑后的音频URL
                Text(
                    "Clipped audio saved at \(url)"
                )
            }
        }
    }
}


// AudioEditor.swift
// 音频剪辑类
import AVFoundation

class AudioEditor: NSObject {
    var audioFile: AVAudioFile?
    var audioEngine = AVAudioEngine()
    var timePitchNode = AVAudioUnitTimePitch()

    init(url: URL) {
        super.init()
        do {
            audioFile = try AVAudioFile(forReading: url)
            let playerNode = AVAudioPlayerNode()
            audioEngine.attach(playerNode)
            audioEngine.attach(timePitchNode)
            
            audioEngine.connect(playerNode, to: timePitchNode, format: audioFile!.processingFormat)
            audioEngine.connect(timePitchNode, to: audioEngine.mainMixerNode, format: audioFile!.processingFormat)
            
            // Now playerNode is set up and ready to be used for playback.
        } catch {
            print("Error initializing audio editor: \(error)")
        }
    }

    func clipAudio(start: TimeInterval, end: TimeInterval, completion: @escaping (URL?) -> Void) {
        guard let audioFile = audioFile else {
            completion(nil)
            return
        }

        let processingFormat = audioFile.processingFormat
        let frameCount = AVAudioFrameCount((end - start) * Double(processingFormat.sampleRate))
        let buffer = AVAudioPCMBuffer(pcmFormat: processingFormat, frameCapacity: frameCount)
        
        // 设置缓冲区的起始位置
        buffer?.frameLength = frameCount
        buffer.framePosition = AVAudioFramePosition(start * Double(processingFormat.sampleRate))

        do {
            try audioFile.read(into: buffer!, frameCount: frameCount)
        } catch {
            print("Error reading audio file: \(error)")
            completion(nil)
            return
        }

        let outputURL = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0].appendingPathComponent("clipped_audio.m4a")
        let audioFileOut = try? AVAudioFile(forWriting: outputURL, settings: processingFormat.settings)


        audioEngine.reset()
        let playerNode = AVAudioPlayerNode()
        audioEngine.attach(playerNode)
        audioEngine.connect(playerNode, to: audioEngine.mainMixerNode, format: processingFormat)

        playerNode.scheduleBuffer(buffer, at: nil, options: .loops, completionHandler: {
            self.audioEngine.stop()
            self.audioEngine.reset()
            completion(outputURL)
        })

        do {
            try audioEngine.start()
            playerNode.play()
        } catch {
            print("Error starting audio engine: \(error)")
            completion(nil)
        }
    }
}
