# -*- coding: utf-8 -*-

from setuptools import find_packages
from setuptools import setup

VERSION_FILE = 'covidapp/__init__.py'


def get_version(version_file=VERSION_FILE):
    """Read package version by importing wpqs.core.version

    If pkg is not found, import from specific file.
    """
    version = '0.0.0'
    try:
        from covidapp import __version__
        version = __version__
    except ImportError:
        # See <https://stackoverflow.com/a/67692/899560>
        import importlib.util
        spec = importlib.util.spec_from_file_location('module.name',
                                                      version_file)
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        version = mod.__version__
    return version


def get_requirements():
    return open('requirements.txt', 'r').readlines()


setup(
    name='covidapp',
    version=get_version(),
    description='covidapp',
    author='OCC',
    author_email='covidstoplight@occ-data.org',
    url='https://covidapp.occ-pla.net/',
    packages=find_packages('covidapp'),
    package_dir={'': 'covidapp'},
    python_requires='>=3',
    include_package_data=True,
    install_requires=get_requirements(),
    license='N/A',
    classifiers=[
        'Development Status :: 3 - Alpha',
        'Operating System :: POSIX',
        'Programming Language :: Python',
    ],
    entry_points={
        'console_scripts': [
        ]
    }
)
