package experiments

import conf.switches.Owner
import experiments.ParticipationGroups._

import java.time.LocalDate

/*
 * This list of active experiments is sorted by participation group.
 */
object ActiveExperiments extends ExperimentsDefinition {
  override val allExperiments: Set[Experiment] =
    Set(
      Lightbox,
      OphanEsm,
      HeaderTopBarSearchCapi,
      AdaptiveSite,
      OfferHttp3,
      DeeplyRead,
    )
  implicit val canCheckExperiment = new CanCheckExperiment(this)
}

object DeeplyRead
    extends Experiment(
      name = "deeply-read",
      description = "When ON, deeply read footer section is displayed",
      owners = Seq(Owner.withGithub("@guardian/dotcom-platform")),
      sellByDate = LocalDate.of(2023, 11, 30),
      participationGroup = Perc0A,
    )

object Lightbox
    extends Experiment(
      name = "lightbox",
      description = "Testing the impact lightbox might have on our CWVs",
      owners = Seq(Owner.withGithub("@guardian/dotcom-platform")),
      sellByDate = LocalDate.of(2023, 11, 30),
      participationGroup = Perc0B,
    )

// Removing while we are still implementing this content type in DCR
//object DCRImageContent
//    extends Experiment(
//      name = "dcr-image-content",
//      description = "Use DCR for image content",
//      owners = Seq(Owner.withGithub("@guardian/dotcom-platform")),
//      sellByDate = LocalDate.of(2024, 1, 1),
//      participationGroup = Perc0E,
//    )

object AdaptiveSite
    extends Experiment(
      name = "adaptive-site",
      description = "Enables serving an adaptive version of the site that responds to page performance",
      owners = Seq(Owner.withName("Open Journalism")),
      sellByDate = LocalDate.of(2023, 12, 5),
      participationGroup = Perc1A,
    )

object HeaderTopBarSearchCapi
    extends Experiment(
      name = "header-top-bar-search-capi",
      description = "Adds CAPI search to the top nav",
      owners = Seq(Owner.withGithub("@guardian/dotcom-platform")),
      sellByDate = LocalDate.of(2023, 11, 10),
      participationGroup = Perc1B,
    )

object OfferHttp3
    extends Experiment(
      name = "offer-http3",
      description = "Offer HTTP3 by providing the header and redirecting URLs to enable loading of assets with HTTP3",
      owners = Seq(Owner.withGithub("paulmr")),
      sellByDate = LocalDate.of(2023, 11, 30),
      participationGroup = Perc1E,
    )

object OphanEsm
    extends Experiment(
      name = "ophan-esm",
      description = "Use ophan-tracker-js@2, which uses native ES Modules",
      owners = Seq(Owner.withGithub("@guardian/ophan")),
      sellByDate = LocalDate.of(2023, 11, 30),
      participationGroup = Perc50,
    )
