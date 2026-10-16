import { SearchBar } from '@linagora/twake-mui'
import { useState } from 'react'
import { createSearchParams, useNavigate, useSearchParams } from 'react-router'
import { useI18n } from 'twake-i18n'

export const ContactSearchBar: React.FC = () => {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [inputValue, setInputValue] = useState(searchParams.get('q') ?? '')

  const handleKeyDown = (event: React.KeyboardEvent): void => {
    if (event.key !== 'Enter' || !(event.target instanceof HTMLInputElement)) {
      return
    }
    event.preventDefault()
    const query = event.target.value.trim()
    if (!query) return
    void navigate({
      pathname: '/contacts/search',
      search: createSearchParams({ q: query }).toString()
    })
    setInputValue('')
  }

  return (
    <div className="u-miw-7" onKeyDown={handleKeyDown}>
      <SearchBar
        value={inputValue}
        onChange={event => setInputValue(event.target.value)}
        placeholder={t('contacts.search.placeholder')}
        onClear={() => setInputValue('')}
      />
    </div>
  )
}
