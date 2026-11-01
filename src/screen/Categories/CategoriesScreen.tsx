import { useMemo, useState } from 'react';
import { FlatList, Text, View, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Header, Page, useUI } from '@/components/common/ui';
import { CatalogState } from '@/components/products/CatalogState';
import { useGetAllCategoriesQuery } from '@/api/endpoints/categorySlice';
import { useApiResult } from '@/api/useApiResult';
import type { CatalogCategory } from '@/api/catalogModels';
import { openCategory } from '@/services/categoryFlow';
import { CategoryTile, CategoryTileSkeleton } from './components/CategoryTile';
import { CreateIntro } from './components/CreateIntro';
import { CategoryFilters, type GroupOption } from './components/CategoryFilters';
import { CATEGORY_GROUPS, inGroup, matchesSearch, type CategoryGroupId } from './categoryGroups';

const GAP = 12;

export default function CategoriesScreen() {
  const { t } = useTranslation();
  const ui = useUI();
  const catalog = useApiResult<CatalogCategory[]>(useGetAllCategoriesQuery());
  const [search, setSearch] = useState('');
  const [group, setGroup] = useState<CategoryGroupId>('all');
  // Page content is at most 760 wide: two columns on phones, three on tablets and web.
  const columns = useWindowDimensions().width >= 600 ? 3 : 2;

  const all = useMemo(() => catalog.data ?? [], [catalog.data]);
  const groups = useMemo<GroupOption[]>(() => [
    { id: 'all', icon: 'apps-outline', count: all.length },
    ...CATEGORY_GROUPS
      .map((item) => ({ id: item.id, icon: item.icon, count: all.filter((category) => inGroup(category, item.id)).length }))
      .filter((item) => item.count > 0),
  ], [all]);
  const visible = useMemo(
    () => all.filter((category) => inGroup(category, group) && matchesSearch(category, search)),
    [all, group, search],
  );
  // Fillers keep a lone last card at column width instead of stretching across the row.
  const cells = useMemo<(CatalogCategory | null)[]>(() => {
    const rest = visible.length % columns;
    return rest ? [...visible, ...Array<null>(columns - rest).fill(null)] : visible;
  }, [visible, columns]);
  const clearFilters = () => { setSearch(''); setGroup('all'); };
  const filtering = search.trim().length > 0 || group !== 'all';

  return (
    <Page scroll={false} style={{ gap: 14 }}>
      <Header title={t('categories.title')} subtitle={t('categories.introTitle')} back />
      {all.length > 0 && (
        <CategoryFilters search={search} onSearch={setSearch} groups={groups} group={group} onGroup={setGroup} />
      )}
      <FlatList
        key={columns}
        data={cells}
        numColumns={columns}
        keyExtractor={(item, index) => item?.id ?? `filler-${index}`}
        columnWrapperStyle={{ gap: GAP }}
        contentContainerStyle={{ gap: GAP, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListHeaderComponent={<CreateIntro count={visible.length} />}
        // Cards translate their text: redraw them when the language changes.
        extraData={t}
        renderItem={({ item }) =>
          item ? <CategoryTile category={item} onPress={() => openCategory(item)} /> : <View style={{ flex: 1 }} />
        }
        ListEmptyComponent={
          catalog.loading ? (
            <View style={{ gap: GAP }}>
              {[0, 1, 2].map((row) => (
                <View key={row} style={{ flexDirection: 'row', gap: GAP }}>
                  {Array.from({ length: columns }, (_, index) => <CategoryTileSkeleton key={index} />)}
                </View>
              ))}
            </View>
          ) : filtering && all.length > 0 ? (
            <View style={{ alignItems: 'center', gap: 14, paddingVertical: 32 }}>
              <Text style={[ui.body, { textAlign: 'center' }]}>
                {search.trim() ? t('categories.noMatches', { query: search.trim() }) : t('categories.noGroupMatches')}
              </Text>
              <Button title={t('categories.clearFilters')} icon="refresh" onPress={clearFilters} />
            </View>
          ) : (
            <CatalogState {...catalog} empty={t('categories.empty')} />
          )
        }
      />
    </Page>
  );
}
