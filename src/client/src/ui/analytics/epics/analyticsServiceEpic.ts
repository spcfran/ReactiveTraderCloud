import { Action } from 'redux'
import { ofType } from 'redux-observable'
import { ignoreElements, tap, map } from 'rxjs/operators'
import { ApplicationEpic } from 'StoreTypes'
import { ANALYTICS_ACTION_TYPES, AnalyticsActions } from '../actions'
import { CurrencyPairPosition } from '../model/currencyPairPosition'
import { getPositionsDataFromSeries } from '../components/positions-chart/chartUtil'

const { fetchAnalytics, bubbleChart } = AnalyticsActions
type FetchAnalyticsAction = ReturnType<typeof fetchAnalytics>

const mapToDto = (ccyPairPosition: CurrencyPairPosition) => ({
  symbol: ccyPairPosition.symbol,
  basePnl: ccyPairPosition.basePnl,
  baseTradedAmount: ccyPairPosition.baseTradedAmount,
})

export const publishPositionUpdateEpic: ApplicationEpic = (action$, state$, { platform }) =>
  action$.pipe(
    ofType<Action, FetchAnalyticsAction>(ANALYTICS_ACTION_TYPES.ANALYTICS_SERVICE),
    tap((action: FetchAnalyticsAction) => {
      const currentPositions = action.payload.currentPositions.map(p => mapToDto(p))
      platform.interop!.publish('position-update', currentPositions)
    }),
    ignoreElements(),
  )

export const formBubbleChartDataEpic: ApplicationEpic = (action$, state$, { platform }) =>
  action$.pipe(
    ofType<Action, FetchAnalyticsAction>(ANALYTICS_ACTION_TYPES.ANALYTICS_SERVICE),
    map((action: FetchAnalyticsAction) => {
      const { currentPositions } = action.payload
      const { currencyPairs } = state$.value
      const positionData = getPositionsDataFromSeries(currentPositions, currencyPairs)
      state$.dispatch(bubbleChart(positionData))
    }),
    ignoreElements(),
  )
