package common.dfp

import common.Box
import common.GuLogging
import play.api.libs.json.Json.toJson
import services.S3
import scala.io.Codec.UTF8
import play.api.libs.json._
import conf.{Configuration}
import services.ParameterStore

import scala.concurrent.{ExecutionContext, Future}

object RemoteBundleAgent extends GuLogging {
  private val commercialPath = "test_commercial_bundles"

  private val assetMapKey = s"CODE/frontend-static/${commercialPath}/assets.map"

  private val commmercialBundleEntrypoint = "commercial-standalone.js"

  private lazy val remoteBundleAgent = Box[Option[String]](None)

  private def jsonToAssetMap(json: String): Option[Map[String, String]] =
    Json.parse(json).validate[Map[String, String]] match {
      case JsSuccess(m, _) => Some(m)
      case JsError(_)      => None
    }

  private def fullUrl(url: String): String = {
    // TODO what about PROD and dev?
    s"https://assets-code.guim.co.uk/${commercialPath}/${url}"
  }

  private def grabRemoteBundleUrlFromStore(): Option[String] = {
    // Retrieve the name of the static assets bucket from Parameter Store
    val parameterStore = new ParameterStore(Configuration.aws.region)
    val bucket = parameterStore.get("/account/services/dotcom-static.bucket")

    val assetMapString = S3.get(assetMapKey, bucket)(UTF8)

    if (assetMapString.isDefined) {
      log.info(s"REMOTE BUNDLE Got asset map from S3: ${assetMapString}")
    } else {
      log.info("REMOTE BUNDLE No asset map found")
    }

    val commercialBundleUrl: Option[String] =
      assetMapString
        .flatMap(jsonToAssetMap)
        .flatMap(assetMap => assetMap.get(commmercialBundleEntrypoint))
        .map(fullUrl)

    if (commercialBundleUrl.isDefined) {
      log.info(s"REMOTE BUNDLE got commercial bundle URL: ${commercialBundleUrl}")
    } else {
      log.info(s"REMOTE BUNDLE couldn't get commercial bundle url")
    }

    commercialBundleUrl
  }

  def refresh() = {
    remoteBundleAgent send grabRemoteBundleUrlFromStore()
  }

  def commercialBundleUrl(): Option[String] = remoteBundleAgent.get()
}