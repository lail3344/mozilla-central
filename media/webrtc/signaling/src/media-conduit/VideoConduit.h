/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

#ifndef VIDEO_SESSION_H_
#define VIDEO_SESSION_H_

#include "mozilla/Attributes.h"

#include "MediaConduitInterface.h"

// Video Engine Includes
#include "webrtc/common_types.h"
#ifdef FF
#undef FF
#endif
#include "webrtc/modules/video_coding/codecs/interface/video_codec_interface.h"
#include "webrtc/video_engine/include/vie_base.h"
#include "webrtc/video_engine/include/vie_capture.h"
#include "webrtc/video_engine/include/vie_codec.h"
#include "webrtc/video_engine/include/vie_external_codec.h"
#include "webrtc/video_engine/include/vie_render.h"
#include "webrtc/video_engine/include/vie_network.h"
#include "webrtc/video_engine/include/vie_file.h"
#include "webrtc/video_engine/include/vie_rtp_rtcp.h"

/** This file hosts several structures identifying different aspects
 * of a RTP Session.
 */

 using  webrtc::ViEBase;
 using  webrtc::ViENetwork;
 using  webrtc::ViECodec;
 using  webrtc::ViECapture;
 using  webrtc::ViERender;
 using  webrtc::ViEExternalCapture;
 using  webrtc::ViEExternalCodec;

namespace mozilla {

class WebrtcAudioConduit;

// Marker interfaces.
class WebrtcVideoEncoder : public VideoEncoder, public webrtc::VideoEncoder {
};

class WebrtcVideoDecoder : public VideoDecoder, public webrtc::VideoDecoder {
};

/**
 * Concrete class for Video session. Hooks up
 *  - media-source and target to external transport
 */
class WebrtcVideoConduit:public VideoSessionConduit
                         ,public webrtc::Transport
                         ,public webrtc::ExternalRenderer
{

public:

  //VoiceEngine defined constant for Payload Name Size.
  static const unsigned int CODEC_PLNAME_SIZE;

  /**
   * Set up A/V sync between this (incoming) VideoConduit and an audio conduit.
   */
  void SyncTo(WebrtcAudioConduit *aConduit);

  /**
   * Function to attach Renderer end-point for the Media-Video conduit.
   * @param aRenderer : Reference to the concrete Video renderer implementation
   * Note: Multiple invocations of this API shall remove an existing renderer
   * and attaches the new to the Conduit.
   */
  virtual MediaConduitErrorCode AttachRenderer(mozilla::RefPtr<VideoRenderer> aVideoRenderer);
  virtual void DetachRenderer();

  /**
   * APIs used by the registered external transport to this Conduit to
   * feed in received RTP Frames to the VideoEngine for decoding
   */
  virtual MediaConduitErrorCode ReceivedRTPPacket(const void *data, int len);

  /**
   * APIs used by the registered external transport to this Conduit to
   * feed in received RTP Frames to the VideoEngine for decoding
   */
  virtual MediaConduitErrorCode ReceivedRTCPPacket(const void *data, int len);

   /**
   * Function to configure send codec for the video session
   * @param sendSessionConfig: CodecConfiguration
   * @result: On Success, the video engine is configured with passed in codec for send
   *          On failure, video engine transmit functionality is disabled.
   * NOTE: This API can be invoked multiple time. Invoking this API may involve restarting
   *        transmission sub-system on the engine.
   */
  virtual MediaConduitErrorCode ConfigureSendMediaCodec(const VideoCodecConfig* codecInfo);

  /**
   * Function to configure list of receive codecs for the video session
   * @param sendSessionConfig: CodecConfiguration
   * @result: On Success, the video engine is configured with passed in codec for send
   *          Also the playout is enabled.
   *          On failure, video engine transmit functionality is disabled.
   * NOTE: This API can be invoked multiple time. Invoking this API may involve restarting
   *        transmission sub-system on the engine.
   */
   virtual MediaConduitErrorCode ConfigureRecvMediaCodecs(
                               const std::vector<VideoCodecConfig* >& codecConfigList);

  /**
   * Register External Transport to this Conduit. RTP and RTCP frames from the VoiceEnigne
   * shall be passed to the registered transport for transporting externally.
   */
  virtual MediaConduitErrorCode AttachTransport(mozilla::RefPtr<TransportInterface> aTransport);

  /**
   * Function to select and change the encoding resolution based on incoming frame size
   * and current available bandwidth.
   * @param width, height: dimensions of the frame
   */
  virtual bool SelectSendResolution(unsigned short width,
                                    unsigned short height);

  /**
   * Function to deliver a capture video frame for encoding and transport
   * @param video_frame: pointer to captured video-frame.
   * @param video_frame_length: size of the frame
   * @param width, height: dimensions of the frame
   * @param video_type: Type of the video frame - I420, RAW
   * @param captured_time: timestamp when the frame was captured.
   *                       if 0 timestamp is automatcally generated by the engine.
   *NOTE: ConfigureSendMediaCodec() SHOULD be called before this function can be invoked
   *       This ensures the inserted video-frames can be transmitted by the conduit
   */
  virtual MediaConduitErrorCode SendVideoFrame(unsigned char* video_frame,
                                                unsigned int video_frame_length,
                                                unsigned short width,
                                                unsigned short height,
                                                VideoType video_type,
                                                uint64_t capture_time);

  virtual MediaConduitErrorCode SetExternalSendCodec(int pltype,
                VideoEncoder* encoder);
  virtual MediaConduitErrorCode SetExternalRecvCodec(int pltype,
                VideoDecoder* decoder);


  /**
   * Webrtc transport implementation to send and receive RTP packet.
   * AudioConduit registers itself as ExternalTransport to the VideoEngine
   */
  virtual int SendPacket(int channel, const void *data, int len) ;

  /**
   * Webrtc transport implementation to send and receive RTCP packet.
   * AudioConduit registers itself as ExternalTransport to the VideoEngine
   */
  virtual int SendRTCPPacket(int channel, const void *data, int len) ;


  /**
   * Webrtc External Renderer Implementation APIs.
   * Raw I420 Frames are delivred to the VideoConduit by the VideoEngine
   */
  virtual int FrameSizeChange(unsigned int, unsigned int, unsigned int);

  virtual int DeliverFrame(unsigned char*,int, uint32_t , int64_t);


  WebrtcVideoConduit():
                      mVideoEngine(nullptr),
                      mTransport(nullptr),
                      mRenderer(nullptr),
                      mPtrViEBase(nullptr),
                      mPtrViECapture(nullptr),
                      mPtrViECodec(nullptr),
                      mPtrViENetwork(nullptr),
                      mPtrViERender(nullptr),
                      mPtrExtCapture(nullptr),
                      mPtrRTP(nullptr),
                      mEngineTransmitting(false),
                      mEngineReceiving(false),
                      mChannel(-1),
                      mCapId(-1),
                      mCurSendCodecConfig(nullptr),
                      mSendingWidth(0),
                      mSendingHeight(0)
  {
  }


  virtual ~WebrtcVideoConduit() ;



  MediaConduitErrorCode Init();

private:

  WebrtcVideoConduit(const WebrtcVideoConduit& other) MOZ_DELETE;
  void operator=(const WebrtcVideoConduit& other) MOZ_DELETE;

  //Local database of currently applied receive codecs
  typedef std::vector<VideoCodecConfig* > RecvCodecList;

  //Function to convert between WebRTC and Conduit codec structures
  void CodecConfigToWebRTCCodec(const VideoCodecConfig* codecInfo,
                                webrtc::VideoCodec& cinst);

  // Function to copy a codec structure to Conduit's database
  bool CopyCodecToDB(const VideoCodecConfig* codecInfo);

  // Functions to verify if the codec passed is already in
  // conduits database
  bool CheckCodecForMatch(const VideoCodecConfig* codecInfo) const;
  bool CheckCodecsForMatch(const VideoCodecConfig* curCodecConfig,
                           const VideoCodecConfig* codecInfo) const;

  //Checks the codec to be applied
  MediaConduitErrorCode ValidateCodecConfig(const VideoCodecConfig* codecInfo, bool send) const;

  //Utility function to dump recv codec database
  void DumpCodecDB() const;
  webrtc::VideoEngine* mVideoEngine;

  mozilla::RefPtr<TransportInterface> mTransport;
  mozilla::RefPtr<VideoRenderer> mRenderer;

  webrtc::ViEBase* mPtrViEBase;
  webrtc::ViECapture* mPtrViECapture;
  webrtc::ViECodec* mPtrViECodec;
  webrtc::ViENetwork* mPtrViENetwork;
  webrtc::ViERender* mPtrViERender;
  webrtc::ViEExternalCapture*  mPtrExtCapture;
  webrtc::ViEExternalCodec*  mPtrExtCodec;
  webrtc::ViERTP_RTCP* mPtrRTP;

  // Engine state we are concerned with.
  bool mEngineTransmitting; //If true ==> Transmit Sub-system is up and running
  bool mEngineReceiving;    // if true ==> Receive Sus-sysmtem up and running

  int mChannel; // Video Channel for this conduit
  int mCapId;   // Capturer for this conduit
  RecvCodecList    mRecvCodecList;
  VideoCodecConfig* mCurSendCodecConfig;
  unsigned short mSendingWidth;
  unsigned short mSendingHeight;

  mozilla::RefPtr<WebrtcAudioConduit> mSyncedTo;
};



} // end namespace

#endif
