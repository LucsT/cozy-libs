import React from 'react'
import { Text, Icon } from 'cozy-ui/transpiled/react'
import MidEllipsis from 'cozy-ui/transpiled/react/MidEllipsis'
import palette from 'cozy-ui/transpiled/react/palette'

const AccountSelectControl = ({ name }) => {
  return (
    <Text className="u-slateGrey u-flex u-flex-items-center u-c-pointer">
      <MidEllipsis text={name} className="u-maw-4" />
      <Icon
        icon="bottom"
        size="12"
        className="u-ml-half"
        color={palette['coolGrey']}
      />
    </Text>
  )
}

export default AccountSelectControl