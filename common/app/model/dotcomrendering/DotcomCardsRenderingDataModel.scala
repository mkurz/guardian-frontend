package model.dotcomrendering

import model.pressed.PressedContent
import play.api.libs.json.Json

case class DotcomCardsRenderingDataModel(cards: List[PressedContent], startIndex: Int)

object DotcomCardsRenderingDataModel {
  implicit val writes = Json.writes[DotcomCardsRenderingDataModel]

  def toJson(model: DotcomCardsRenderingDataModel): String = {
    val jsValue = Json.toJson(model)
    Json.stringify(DotcomRenderingUtils.withoutNull(jsValue))
  }
}